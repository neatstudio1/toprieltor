'use strict'

const fs = require('fs')
const path = require('path')

const SOURCE_DIR =
  process.env.PARSER_REPO_PARSED_DIR ||
  path.join(__dirname, '..', '..', 'parsEKBzastroishiki', 'data', 'parsed')
const TARGET_DIR = path.join(__dirname, '..', 'data', 'parsed')

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Источник не найден: ${SOURCE_DIR}`)
    console.error('Задайте PARSER_REPO_PARSED_DIR, если репозиторий парсеров лежит в другом месте.')
    process.exit(1)
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true })

  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.json'))
  if (!files.length) {
    console.error(`В ${SOURCE_DIR} нет .json файлов`)
    process.exit(1)
  }

  for (const file of files) {
    fs.copyFileSync(path.join(SOURCE_DIR, file), path.join(TARGET_DIR, file))
    console.log(`✔ ${file}`)
  }

  console.log(`\nСкопировано файлов: ${files.length} → ${TARGET_DIR}`)
}

main()
