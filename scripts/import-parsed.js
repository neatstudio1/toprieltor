'use strict'

const fs = require('fs')
const path = require('path')
const { slugify, uniqueSlug } = require('./lib/slugify')
const { deepDecode } = require('./lib/decode-entities')

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'
const STRAPI_TOKEN = process.env.STRAPI_IMPORT_TOKEN
const PARSED_DIR = process.env.PARSED_DIR || path.join(__dirname, '..', 'data', 'parsed')
const ADMIN_CREDENTIALS_FILE = path.join(__dirname, '..', 'apps', 'cms', '.admin-credentials.local')

if (!STRAPI_TOKEN) {
  console.error('STRAPI_IMPORT_TOKEN не задан.')
  console.error('Сначала выполните: npm run bootstrap:strapi — он создаст токен и допишет .env')
  process.exit(1)
}

// Проекты без единой квартиры (пустая карточка ЖК на сайте) публично скрываются —
// переводятся в статус «Черновик». Draft/publish не входит в REST-права API-токена
// (это admin-only content-manager экшены), поэтому логинимся отдельно как admin.
async function adminLogin() {
  if (!fs.existsSync(ADMIN_CREDENTIALS_FILE)) {
    throw new Error(
      `Нет файла с кредами ${ADMIN_CREDENTIALS_FILE}. Сначала выполните: node scripts/bootstrap-strapi.js create-admin`
    )
  }
  const raw = fs.readFileSync(ADMIN_CREDENTIALS_FILE, 'utf-8')
  const email = raw.match(/email=(.*)/)[1].trim()
  const password = raw.match(/password=(.*)/)[1].trim()
  const res = await fetch(`${STRAPI_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`admin/login -> HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`)
  return body.data.token
}

async function setProjectPublishState(documentId, publish, adminJwt) {
  const action = publish ? 'publish' : 'unpublish'
  const res = await fetch(
    `${STRAPI_URL}/content-manager/collection-types/api::project.project/${documentId}/actions/${action}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminJwt}` },
      body: JSON.stringify({})
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${action} project ${documentId} -> HTTP ${res.status}: ${text.slice(0, 300)}`)
  }
}

async function api(pathname, options = {}) {
  const res = await fetch(`${STRAPI_URL}/api${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...(options.headers || {})
    }
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    const message = body?.error?.message || text.slice(0, 300)
    throw new Error(`${options.method || 'GET'} /api${pathname} -> HTTP ${res.status}: ${message}`)
  }
  return body
}

async function findOne(collection, filters) {
  const query = Object.entries(filters)
    .map(([k, v]) => `filters${k}=${encodeURIComponent(v)}`)
    .join('&')
  const body = await api(`/${collection}?${query}`)
  return body?.data?.[0] ?? null
}

async function upsert(collection, filters, buildPayload) {
  const existing = await findOne(collection, filters)
  const payload = buildPayload(existing)
  if (existing) {
    const id = existing.documentId ?? existing.id
    const updated = await api(`/${collection}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: payload })
    })
    return { record: updated.data, created: false }
  }
  const created = await api(`/${collection}`, {
    method: 'POST',
    body: JSON.stringify({ data: payload })
  })
  return { record: created.data, created: true }
}

function originOf(url) {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function mapQueues(queues) {
  return (queues || []).map((q) => ({
    number: q['номер'],
    building: q['корпус'] ?? null,
    delivery: q['сдача'] ?? null
  }))
}

async function importDeveloperFile(filePath, usedProjectSlugs, adminJwt) {
  const fileBase = path.basename(filePath, '.json')
  const data = deepDecode(JSON.parse(fs.readFileSync(filePath, 'utf-8')))
  const stats = { projects: 0, apartments: 0, errors: [] }

  const developerSlug = slugify(fileBase)
  const siteUrl = originOf(data.projects?.find((p) => p.link)?.link)

  const { record: developer } = await upsert(
    'developers',
    { '[slug][$eq]': developerSlug },
    () => ({
      slug: developerSlug,
      name: data.developer,
      site_url: siteUrl
    })
  );

  for (const project of data.projects || []) {
    try {
      const projectSlugBase = slugify(project.name)
      const projectSlug = uniqueSlug(projectSlugBase, usedProjectSlugs)
      if (projectSlug !== projectSlugBase) {
        stats.errors.push(
          `[${fileBase}] «${project.name}» → slug "${projectSlugBase}" уже занят другим застройщиком, использован "${projectSlug}" — проверьте, не один ли это объект`
        )
      }

      const { record: projectRecord, created: projectCreated } = await upsert(
        'projects',
        { '[slug][$eq]': projectSlug },
        (existing) => ({
          slug: projectSlug,
          developer: developer.documentId ?? developer.id,
          name: project.name,
          url: project.link,
          district: project.location,
          geo_lat: project.geo?.lat ?? null,
          geo_lon: project.geo?.lon ?? null,
          concept: project.concept,
          advantages: project.advantages || [],
          infrastructure: project.infrastructure || [],
          finish_types: project.finish_types || [],
          delivery_date: project.delivery_date,
          queues: mapQueues(project.queues),
          photos: project.photos || [],
          matkapital: existing?.matkapital === true ? true : false
        })
      )
      stats.projects += 1
      void projectCreated

      const projectId = projectRecord.documentId ?? projectRecord.id
      const usedApartmentSlugs = new Set()

      for (const apt of project.apartments || []) {
        try {
          const aptSlugBase = slugify(`${apt.type}-${apt.area_m2}`)
          const aptSlug = uniqueSlug(aptSlugBase, usedApartmentSlugs)

          await upsert(
            'apartments',
            {
              '[project][slug][$eq]': projectSlug,
              '[slug][$eq]': aptSlug
            },
            () => ({
              slug: aptSlug,
              project: projectId,
              type: apt.type,
              area_m2: apt.area_m2,
              price_from: apt.price_from,
              price_min: apt.price_min,
              price_max: apt.price_max,
              lots_count: apt.lots_count,
              floors: apt.floors || [],
              finish: apt.finish,
              tags: apt.tags || [],
              floor_plan_url: apt.floor_plan_link,
              photo_urls: apt.photos || [],
              type_corrected: Boolean(apt.type_corrected)
            })
          )
          stats.apartments += 1
        } catch (err) {
          stats.errors.push(`[${fileBase}] ${project.name} / квартира ${apt.type} ${apt.area_m2}м²: ${err.message}`)
        }
      }

      try {
        await setProjectPublishState(projectId, (project.apartments || []).length > 0, adminJwt)
      } catch (err) {
        stats.errors.push(`[${fileBase}] ${project.name}: не удалось обновить статус публикации — ${err.message}`)
      }
    } catch (err) {
      stats.errors.push(`[${fileBase}] проект ${project.name}: ${err.message}`)
    }
  }

  return { developer: data.developer, ...stats }
}

async function main() {
  if (!fs.existsSync(PARSED_DIR)) {
    console.error(`Не найдена директория с данными: ${PARSED_DIR}`)
    console.error('Сначала выполните: npm run sync:parsed')
    process.exit(1)
  }

  const files = fs
    .readdirSync(PARSED_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(PARSED_DIR, f))

  if (!files.length) {
    console.error(`В ${PARSED_DIR} нет .json файлов. Выполните: npm run sync:parsed`)
    process.exit(1)
  }

  // Shared across all files: two developers can list the same building under
  // slightly different names (e.g. "Repin Towers" vs "REPIN TOWERS") — a
  // per-file Set would let the second one silently overwrite the first.
  const usedProjectSlugs = new Set()

  console.log('Логинюсь в /admin (для управления статусом публикации проектов)…')
  const adminJwt = await adminLogin()

  const results = []
  for (const file of files) {
    const name = path.basename(file)
    console.log(`\n🏗️  Импорт ${name}…`)
    try {
      const result = await importDeveloperFile(file, usedProjectSlugs, adminJwt)
      results.push(result)
      console.log(
        `✅ ${result.developer}: проектов ${result.projects}, квартир ${result.apartments}` +
          (result.errors.length ? `, ошибок ${result.errors.length}` : '')
      )
      result.errors.forEach((e) => console.error(`   ⚠️  ${e}`))
    } catch (err) {
      console.error(`❌ ${name}: ${err.message}`)
      results.push({ developer: name, projects: 0, apartments: 0, errors: [err.message] })
    }
  }

  const totalProjects = results.reduce((s, r) => s + r.projects, 0)
  const totalApartments = results.reduce((s, r) => s + r.apartments, 0)
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0)

  console.log('\n═══════════════ ИТОГО ═══════════════')
  console.log(`Застройщиков: ${results.length}`)
  console.log(`Проектов: ${totalProjects}`)
  console.log(`Квартир: ${totalApartments}`)
  console.log(`Ошибок: ${totalErrors}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
