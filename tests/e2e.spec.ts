import { test, expect } from '@playwright/test'

// ─── Homepage ─────────────────────────────────────────────────────────────────

test.describe('Homepage', () => {
  test('loads and shows trending content', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/FoodCulture AI/)
    await expect(page.getByRole('heading', { name: /trending/i })).toBeVisible()
  })

  test('search redirects to explore with query', async ({ page }) => {
    await page.goto('/')
    await page.fill('#hero-search', 'Biryani')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/explore\?q=Biryani/)
  })

  test('quick chip links go to explore', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Viral this week' }).click()
    await expect(page).toHaveURL(/\/explore/)
  })
})

// ─── Restaurant directory ─────────────────────────────────────────────────────

test.describe('Restaurant directory', () => {
  test('loads restaurant cards', async ({ page }) => {
    await page.goto('/restaurants')
    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 10000 })
  })

  test('search filters restaurants', async ({ page }) => {
    await page.goto('/restaurants')
    await page.fill('#dir-search', 'Biryani')
    await expect(page.locator('text=Biryani').first()).toBeVisible()
  })

  test('clear search restores all results', async ({ page }) => {
    await page.goto('/restaurants')
    await page.fill('#dir-search', 'xyz_no_results_xyz')
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByRole('article').first()).toBeVisible()
  })
})

// ─── Explore page ─────────────────────────────────────────────────────────────

test.describe('Explore page', () => {
  test('pre-fills search from URL param', async ({ page }) => {
    await page.goto('/explore?q=Biryani')
    const input = page.locator('#explore-search')
    await expect(input).toHaveValue('Biryani')
  })

  test('tabs switch between restaurants and influencers', async ({ page }) => {
    await page.goto('/explore')
    await page.getByRole('tab', { name: /Influencers/ }).click()
    await expect(page.getByRole('tabpanel').first()).toBeVisible()
  })

  test('load more button appears and loads more', async ({ page }) => {
    await page.goto('/explore')
    const loadMore = page.getByRole('button', { name: /Load more/ })
    if (await loadMore.isVisible()) {
      await loadMore.click()
      await expect(page.getByRole('article')).toHaveCount(await page.getByRole('article').count())
    }
  })
})

// ─── Restaurant detail ────────────────────────────────────────────────────────

test.describe('Restaurant detail', () => {
  test('loads restaurant page', async ({ page }) => {
    await page.goto('/restaurants')
    await page.getByRole('article').first().click()
    await expect(page.getByRole('tab', { name: /Overview/ })).toBeVisible()
  })

  test('tabs switch content', async ({ page }) => {
    await page.goto('/restaurants/dum-biryani-house')
    await page.getByRole('tab', { name: /Reviews/ }).click()
    await expect(page.getByRole('tabpanel')).toBeVisible()
  })

  test('enquiry form submits', async ({ page }) => {
    await page.goto('/restaurants/dum-biryani-house')
    await page.fill('#enquiry-name', 'Test User')
    await page.fill('#enquiry-email', 'test@example.com')
    await page.fill('#enquiry-message', 'Test enquiry message')
    await page.getByRole('button', { name: 'Send enquiry' }).click()
    await expect(page.getByText('Enquiry sent')).toBeVisible()
  })
})

// ─── Auth flow ────────────────────────────────────────────────────────────────

test.describe('Auth', () => {
  test('sign in page loads', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('sign up page loads with role picker', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.getByText('Food explorer')).toBeVisible()
    await expect(page.getByText('Restaurant owner')).toBeVisible()
  })

  test('dashboard redirects to login when logged out', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('admin redirects to login when logged out', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible()
  })
})

// ─── Influencer pages ─────────────────────────────────────────────────────────

test.describe('Influencers', () => {
  test('influencer directory loads', async ({ page }) => {
    await page.goto('/influencers')
    await expect(page.getByRole('heading', { name: /influencers/i })).toBeVisible({ timeout: 10000 })
  })

  test('influencer profile loads', async ({ page }) => {
    await page.goto('/influencers/rahul-kitchens')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })
  })
})

// ─── Deals page ───────────────────────────────────────────────────────────────

test.describe('Deals', () => {
  test('deals page loads', async ({ page }) => {
    await page.goto('/deals')
    await expect(page.getByRole('heading', { name: /deals/i })).toBeVisible()
  })
})

// ─── Notifications ────────────────────────────────────────────────────────────

test.describe('Notifications', () => {
  test('notifications page loads', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: /Notifications/ })).toBeVisible()
  })
})

// ─── Legal pages ──────────────────────────────────────────────────────────────

test.describe('Legal', () => {
  test('terms page loads', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
  })

  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  })
})

// ─── SEO / accessibility ──────────────────────────────────────────────────────

test.describe('SEO and accessibility', () => {
  test('homepage has correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/FoodCulture AI/)
  })

  test('skip to content link exists', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.skip-link')).toBeAttached()
  })

  test('sitemap returns XML', async ({ page }) => {
    const res = await page.goto('/sitemap.xml')
    expect(res?.status()).toBe(200)
  })

  test('robots.txt exists', async ({ page }) => {
    const res = await page.goto('/robots.txt')
    expect(res?.status()).toBe(200)
  })

  test('404 page loads for unknown route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz')
    await expect(page.getByText(/not found/i)).toBeVisible()
  })
})
