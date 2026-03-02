import { test, expect } from '@playwright/test'
import { captureScreenshot, assertNoConsoleErrors } from './helpers'

test.beforeEach(async ({ page }) => {
  // Clear localStorage before each test for a clean state
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('Empty state screen - shows title, input, and empty message', async ({ page }) => {
  const checkNoErrors = assertNoConsoleErrors(page)

  await expect(page.getByRole('heading', { name: 'SimpleTodo' })).toBeVisible()
  await expect(page.getByPlaceholder('Add a new todo...')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add' })).toBeVisible()
  await expect(page.getByText('No todos yet. Add one above!')).toBeVisible()

  await captureScreenshot(page, '01-empty-state')
  checkNoErrors()
})

test('Happy path - Add a new todo via Enter key', async ({ page }) => {
  const input = page.getByPlaceholder('Add a new todo...')

  await input.fill('Buy groceries')
  await input.press('Enter')

  // Todo appears at the top
  const todoItem = page.getByRole('listitem').first()
  await expect(todoItem).toContainText('Buy groceries')

  // Checkbox is present and unchecked
  const checkbox = todoItem.getByRole('checkbox')
  await expect(checkbox).toBeVisible()
  await expect(checkbox).not.toBeChecked()

  // Input is cleared
  await expect(input).toHaveValue('')

  // Empty state message is gone
  await expect(page.getByText('No todos yet. Add one above!')).not.toBeVisible()
})

test('Happy path - Add a new todo via Add button', async ({ page }) => {
  const input = page.getByPlaceholder('Add a new todo...')
  const addButton = page.getByRole('button', { name: 'Add' })

  await input.fill('Walk the dog')
  await addButton.click()

  await expect(page.getByRole('listitem').first()).toContainText('Walk the dog')
  await expect(input).toHaveValue('')
})

test('Happy path - Newest todo appears at the top of the list', async ({ page }) => {
  const input = page.getByPlaceholder('Add a new todo...')

  await input.fill('First todo')
  await input.press('Enter')

  await input.fill('Second todo')
  await input.press('Enter')

  await input.fill('Third todo')
  await input.press('Enter')

  const items = page.getByRole('listitem')
  await expect(items.first()).toContainText('Third todo')
  await expect(items.nth(1)).toContainText('Second todo')
  await expect(items.nth(2)).toContainText('First todo')
})

test('Happy path - Complete a todo by clicking checkbox', async ({ page }) => {
  const input = page.getByPlaceholder('Add a new todo...')
  await input.fill('Read a book')
  await input.press('Enter')

  const todoItem = page.getByRole('listitem').first()
  const checkbox = todoItem.getByRole('checkbox')

  await checkbox.click()

  // Checkbox is now checked
  await expect(checkbox).toBeChecked()

  // Text has strikethrough and muted color
  const todoText = todoItem.locator('span')
  await expect(todoText).toHaveClass(/line-through/)
  await expect(todoText).toHaveClass(/text-gray-400/)

  await captureScreenshot(page, '02-completed-todo')
})

test('State toggle - Uncheck a completed todo removes strikethrough', async ({ page }) => {
  const input = page.getByPlaceholder('Add a new todo...')
  await input.fill('Stretch in the morning')
  await input.press('Enter')

  const todoItem = page.getByRole('listitem').first()
  const checkbox = todoItem.getByRole('checkbox')
  const todoText = todoItem.locator('span')

  // Complete it
  await checkbox.click()
  await expect(checkbox).toBeChecked()
  await expect(todoText).toHaveClass(/line-through/)

  // Uncheck it
  await checkbox.click()
  await expect(checkbox).not.toBeChecked()
  await expect(todoText).not.toHaveClass(/line-through/)
  await expect(todoText).toHaveClass(/text-gray-800/)
})

test('Data persistence - Todos survive page reload', async ({ page }) => {
  const input = page.getByPlaceholder('Add a new todo...')

  await input.fill('Persistent todo 1')
  await input.press('Enter')

  await input.fill('Persistent todo 2')
  await input.press('Enter')

  // Mark first (top) todo as completed
  await page.getByRole('listitem').first().getByRole('checkbox').click()

  // Reload the page
  await page.reload()

  const items = page.getByRole('listitem')
  await expect(items).toHaveCount(2)

  // "Persistent todo 2" should be at top (added last) and unchecked
  await expect(items.first()).toContainText('Persistent todo 2')
  await expect(items.first().getByRole('checkbox')).not.toBeChecked()

  // "Persistent todo 1" should be second and checked
  await expect(items.nth(1)).toContainText('Persistent todo 1')
  await expect(items.nth(1).getByRole('checkbox')).toBeChecked()
  await expect(items.nth(1).locator('span')).toHaveClass(/line-through/)

  await captureScreenshot(page, '03-after-reload')
})

test('Edge case - Empty input does not add a todo', async ({ page }) => {
  const addButton = page.getByRole('button', { name: 'Add' })

  // Button should be disabled when input is empty
  await expect(addButton).toBeDisabled()

  // Click has no effect — no todos added
  await addButton.click({ force: true })
  await expect(page.getByText('No todos yet. Add one above!')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('Edge case - Whitespace-only input does not add a todo', async ({ page }) => {
  const input = page.getByPlaceholder('Add a new todo...')

  await input.fill('   ')
  await input.press('Enter')

  await expect(page.getByText('No todos yet. Add one above!')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('Active list screen - Mixed completed and incomplete todos', async ({ page }) => {
  const input = page.getByPlaceholder('Add a new todo...')

  await input.fill('Write tests')
  await input.press('Enter')

  await input.fill('Fix the bug')
  await input.press('Enter')

  await input.fill('Ship the feature')
  await input.press('Enter')

  // Complete the middle item (Fix the bug)
  const items = page.getByRole('listitem')
  await items.nth(1).getByRole('checkbox').click()

  await captureScreenshot(page, '04-active-list')

  // Verify mixed states
  await expect(items.first().locator('span')).not.toHaveClass(/line-through/)
  await expect(items.nth(1).locator('span')).toHaveClass(/line-through/)
  await expect(items.nth(2).locator('span')).not.toHaveClass(/line-through/)
})
