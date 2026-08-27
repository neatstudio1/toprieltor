'use strict'

/**
 * Headless bootstrap for local Strapi dev instance — no clicking through /admin.
 *
 *   node scripts/bootstrap-strapi.js create-admin   # run BEFORE starting `strapi develop`
 *   node scripts/bootstrap-strapi.js create-token    # run AFTER `strapi develop` is up and reachable
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawnSync } = require('child_process')

const CMS_DIR = path.join(__dirname, '..', 'apps', 'cms')
const CREDENTIALS_FILE = path.join(CMS_DIR, '.admin-credentials.local')
const ROOT_ENV_FILE = path.join(__dirname, '..', '.env')

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'
const ADMIN_EMAIL = process.env.STRAPI_ADMIN_EMAIL || 'sergei.khakimyanov@gmail.com'
const IMPORT_TOKEN_NAME = 'catalog-importer'
const CONTENT_FACTORY_TOKEN_NAME = 'content-factory-publisher'

const COLLECTION_TYPES = [
  'api::developer.developer',
  'api::project.project',
  'api::apartment.apartment',
  'api::article.article',
  'api::district.district',
  'api::service.service'
]
const SINGLE_TYPES = ['api::mortgage-config.mortgage-config', 'api::home-page.home-page']
const CONTENT_TYPES = [...COLLECTION_TYPES, ...SINGLE_TYPES]
const LEAD_UID = 'api::lead.lead'
const COMMENT_UID = 'api::comment.comment'

function generatePassword() {
  // Strapi admin password policy: 8+ chars, upper, lower, number.
  const raw = crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, 'x')
  return `Aa1${raw}`
}

function createAdmin() {
  const password = generatePassword()
  const args = [
    'strapi',
    'admin:create-user',
    '--email', ADMIN_EMAIL,
    '--password', password,
    '--firstname', 'Sergei',
    '--lastname', 'Khakimyanov'
  ]
  console.log(`Создаю admin-пользователя ${ADMIN_EMAIL}…`)
  const result = spawnSync('npx', args, { cwd: CMS_DIR, stdio: 'inherit' })
  if (result.status !== 0) {
    console.error('\n❌ Не удалось создать admin-пользователя (см. вывод выше).')
    console.error('   Если пользователь уже существует — это нормально, продолжайте с create-token.')
    process.exit(1)
  }
  fs.writeFileSync(
    CREDENTIALS_FILE,
    `email=${ADMIN_EMAIL}\npassword=${password}\n`,
    { mode: 0o600 }
  )
  console.log(`\n✅ Admin создан. Креды сохранены в ${CREDENTIALS_FILE} (в .gitignore).`)
  console.log('   Смените пароль в /admin после первого входа.')
}

async function api(pathname, options = {}) {
  const res = await fetch(`${STRAPI_URL}${pathname}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${pathname} -> HTTP ${res.status}: ${text.slice(0, 400)}`)
  }
  return body
}

async function adminLogin() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    throw new Error(`Нет файла с кредами ${CREDENTIALS_FILE}. Сначала запустите: create-admin`)
  }
  const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8')
  const email = raw.match(/email=(.*)/)[1].trim()
  const password = raw.match(/password=(.*)/)[1].trim()
  const body = await api('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  return body.data.token
}

function importerPermissions() {
  return [
    ...COLLECTION_TYPES.flatMap((uid) => [`${uid}.find`, `${uid}.findOne`, `${uid}.create`, `${uid}.update`]),
    ...SINGLE_TYPES.flatMap((uid) => [`${uid}.find`, `${uid}.update`]),
    'api::article.article.delete'
  ]
}

async function createImportToken(jwt) {
  const body = await api('/admin/api-tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      name: IMPORT_TOKEN_NAME,
      description: 'Импорт каталога из data/parsed + сидинг контента (scripts/import-parsed.js, scripts/seed-content.js)',
      type: 'custom',
      lifespan: null,
      permissions: importerPermissions()
    })
  })
  return body.data.accessKey
}

async function updateImportTokenPermissions(jwt) {
  const listBody = await api('/admin/api-tokens', { headers: { Authorization: `Bearer ${jwt}` } })
  const existing = listBody.data.find((t) => t.name === IMPORT_TOKEN_NAME)
  if (!existing) throw new Error(`Токен "${IMPORT_TOKEN_NAME}" не найден — запустите create-token`)
  await api(`/admin/api-tokens/${existing.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      name: existing.name,
      description: existing.description,
      type: existing.type,
      permissions: importerPermissions()
    })
  })
}

async function enablePublicRead(jwt) {
  const rolesBody = await api('/users-permissions/roles', {
    headers: { Authorization: `Bearer ${jwt}` }
  })
  const publicRole = rolesBody.roles.find((r) => r.type === 'public')
  if (!publicRole) throw new Error('Публичная роль не найдена')

  const roleBody = await api(`/users-permissions/roles/${publicRole.id}`, {
    headers: { Authorization: `Bearer ${jwt}` }
  })
  const role = roleBody.role

  for (const uid of CONTENT_TYPES) {
    const controllerName = uid.split('.').pop()
    const permKey = uid.split('.')[0] // e.g. 'api::apartment.apartment' -> 'api::apartment'
    const controllerPerms = role.permissions?.[permKey]?.controllers?.[controllerName]
    if (!controllerPerms) continue
    for (const action of Object.keys(controllerPerms)) {
      if (action === 'find' || action === 'findOne') {
        controllerPerms[action].enabled = true
      }
    }
  }

  await api(`/users-permissions/roles/${publicRole.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      name: role.name,
      description: role.description,
      type: role.type,
      permissions: role.permissions
    })
  })
}

// Enables only the given actions (e.g. ['create'], or ['find', 'create']) on
// the public role for one content-type UID — leaves the rest off, so e.g.
// leads stay create-only and never publicly readable/editable.
async function enablePublicActions(uid, actions, jwt) {
  const rolesBody = await api('/users-permissions/roles', {
    headers: { Authorization: `Bearer ${jwt}` }
  })
  const publicRole = rolesBody.roles.find((r) => r.type === 'public')
  if (!publicRole) throw new Error('Публичная роль не найдена')

  const roleBody = await api(`/users-permissions/roles/${publicRole.id}`, {
    headers: { Authorization: `Bearer ${jwt}` }
  })
  const role = roleBody.role

  const controllerName = uid.split('.').pop()
  const permKey = uid.split('.')[0]
  const controllerPerms = role.permissions?.[permKey]?.controllers?.[controllerName]
  if (!controllerPerms) {
    throw new Error(`Не найдены разрешения для ${uid} — content-type ещё не подхвачен Strapi?`)
  }
  for (const action of actions) {
    if (!controllerPerms[action]) {
      throw new Error(`Не найдено разрешение ${action} для ${uid}`)
    }
    controllerPerms[action].enabled = true
  }

  await api(`/users-permissions/roles/${publicRole.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      name: role.name,
      description: role.description,
      type: role.type,
      permissions: role.permissions
    })
  })
}

function persistToken(token, envVarName = 'STRAPI_IMPORT_TOKEN') {
  const line = `${envVarName}=${token}\n`
  const existing = fs.existsSync(ROOT_ENV_FILE) ? fs.readFileSync(ROOT_ENV_FILE, 'utf-8') : ''
  const withoutOldToken = existing
    .split('\n')
    .filter((l) => !l.startsWith(`${envVarName}=`))
    .join('\n')
  fs.writeFileSync(ROOT_ENV_FILE, `${withoutOldToken.trimEnd()}\n${line}`.trimStart())
  console.log(`✅ ${envVarName} записан в ${ROOT_ENV_FILE}`)
}

async function createContentFactoryToken() {
  console.log('Логинюсь в /admin…')
  const jwt = await adminLogin()

  const listBody = await api('/admin/api-tokens', { headers: { Authorization: `Bearer ${jwt}` } })
  const existing = listBody.data.find((t) => t.name === CONTENT_FACTORY_TOKEN_NAME)
  if (existing) {
    console.log(`Удаляю старый токен "${CONTENT_FACTORY_TOKEN_NAME}" (accessKey всё равно не переиспользовать)…`)
    await api(`/admin/api-tokens/${existing.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${jwt}` } })
  }

  console.log(`Создаю API-токен "${CONTENT_FACTORY_TOKEN_NAME}" (только create/update на articles)…`)
  const body = await api('/admin/api-tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      name: CONTENT_FACTORY_TOKEN_NAME,
      description: 'Автопостинг статей из внешнего контент-завода. См. docs/content-factory-api.md',
      type: 'custom',
      lifespan: null,
      permissions: ['api::article.article.create', 'api::article.article.update']
    })
  })

  persistToken(body.data.accessKey, 'STRAPI_CONTENT_FACTORY_TOKEN')
  console.log('\n⚠️  Этот токен нужно передать команде контент-завода — он не используется скриптами этого репозитория.')
}

async function createToken() {
  console.log('Логинюсь в /admin…')
  const jwt = await adminLogin()

  console.log('Открываю публичный доступ на чтение (find/findOne) для каталога…')
  try {
    await enablePublicRead(jwt)
    console.log('✅ Публичное чтение включено для developers/projects/apartments/mortgage-config.')
  } catch (err) {
    console.error(`⚠️  Не удалось автоматически включить публичное чтение: ${err.message}`)
    console.error('   Включите вручную: /admin → Settings → Roles → Public → find/findOne для нужных типов.')
  }

  console.log('Открываю публичный доступ на create (только create) для leads…')
  try {
    await enablePublicActions(LEAD_UID, ['create'], jwt)
    console.log('✅ Публичный create включён для leads (find/update/delete остаются закрытыми).')
  } catch (err) {
    console.error(`⚠️  Не удалось включить публичный create для leads: ${err.message}`)
    console.error('   Включите вручную: /admin → Settings → Roles → Public → create для Lead.')
  }

  console.log('Открываю публичный доступ на find+create для комментариев…')
  try {
    await enablePublicActions(COMMENT_UID, ['find', 'create'], jwt)
    console.log('✅ Публичные find+create включены для комментариев (update/delete остаются закрытыми).')
  } catch (err) {
    console.error(`⚠️  Не удалось включить публичный доступ для комментариев: ${err.message}`)
    console.error('   Включите вручную: /admin → Settings → Roles → Public → find, create для Comment.')
  }

  console.log(`Создаю API-токен "${IMPORT_TOKEN_NAME}"…`)
  const token = await createImportToken(jwt)
  persistToken(token)
}

async function updateToken() {
  console.log('Логинюсь в /admin…')
  const jwt = await adminLogin()

  console.log('Обновляю публичный доступ на чтение…')
  try {
    await enablePublicRead(jwt)
    console.log('✅ Публичное чтение обновлено.')
  } catch (err) {
    console.error(`⚠️  Не удалось автоматически включить публичное чтение: ${err.message}`)
  }

  console.log('Открываю публичный доступ на create (только create) для leads…')
  try {
    await enablePublicActions(LEAD_UID, ['create'], jwt)
    console.log('✅ Публичный create включён для leads (find/update/delete остаются закрытыми).')
  } catch (err) {
    console.error(`⚠️  Не удалось включить публичный create для leads: ${err.message}`)
    console.error('   Включите вручную: /admin → Settings → Roles → Public → create для Lead.')
  }

  console.log('Открываю публичный доступ на find+create для комментариев…')
  try {
    await enablePublicActions(COMMENT_UID, ['find', 'create'], jwt)
    console.log('✅ Публичные find+create включены для комментариев (update/delete остаются закрытыми).')
  } catch (err) {
    console.error(`⚠️  Не удалось включить публичный доступ для комментариев: ${err.message}`)
    console.error('   Включите вручную: /admin → Settings → Roles → Public → find, create для Comment.')
  }

  console.log(`Обновляю права токена "${IMPORT_TOKEN_NAME}" (accessKey не меняется)…`)
  await updateImportTokenPermissions(jwt)
  console.log('✅ Права токена обновлены.')
}

async function main() {
  const cmd = process.argv[2]
  if (cmd === 'create-admin') return createAdmin()
  if (cmd === 'create-token') return createToken()
  if (cmd === 'update-token') return updateToken()
  if (cmd === 'create-content-factory-token') return createContentFactoryToken()
  console.error(
    'Использование: node scripts/bootstrap-strapi.js <create-admin|create-token|update-token|create-content-factory-token>'
  )
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
