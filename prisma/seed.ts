import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const csvPath = path.join(__dirname, 'data', 'words.csv')
  const content = fs.readFileSync(csvPath, 'utf-8')

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Array<{ 'No.': string; 単語: string; 意味: string }>

  console.log(`Seeding ${records.length} words...`)

  await prisma.word.deleteMany()

  for (const record of records) {
    await prisma.word.create({
      data: {
        no: parseInt(record['No.'], 10),
        term: record['単語'].trim(),
        definition: record['意味'].trim(),
      },
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
