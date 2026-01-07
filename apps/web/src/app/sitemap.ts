import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { locales } from '@/i18n/config'

const baseUrl = 'https://calmar.cl'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('sku, updated_at')

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Static pages for each locale
  for (const locale of locales) {
    sitemapEntries.push(
      {
        url: `${baseUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/${locale}/shop`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/${locale}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/${locale}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      }
    )

    // Dynamic product pages
    if (products) {
      products.forEach((product) => {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/shop/${product.sku}`,
          lastModified: new Date(product.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      })
    }
  }

  return sitemapEntries
}
