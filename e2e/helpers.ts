import { Page } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const screenshotsDir = path.join(__dirname, 'screenshots')

export async function captureScreenshot(page: Page, name: string): Promise<void> {
  try {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }
    await page.screenshot({ path: path.join(screenshotsDir, `${name}.png`), fullPage: true })
  } catch (err) {
    console.error(`Failed to capture screenshot "${name}":`, err)
  }
}

export function assertNoConsoleErrors(page: Page): () => void {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  return () => {
    if (errors.length > 0) {
      throw new Error(`Console errors detected:\n${errors.join('\n')}`)
    }
  }
}
