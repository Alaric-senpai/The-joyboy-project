import { describe, expect, it, beforeAll } from 'vitest'
import MangaDexSource from '..'

describe('MangaDex Source Tests', () => {
    let source: MangaDexSource
    const searchTerm = "Kanojyo to Himitsu to Koimoyou"
    
    // Test manga ID from demo output
    const testMangaId = 'de5cf14e-8364-454f-9e52-fa612d78a0e4'
    const testChapterId = '107ca12c-eeba-414d-8f59-f13dba4b36ef'

    beforeAll(() => {
        source = new MangaDexSource()
    })

    describe('Source Metadata', () => {
        it('should have correct source ID', () => {
            expect(source.id).toBe('mangadex')
        })

        it('should have correct base URL', () => {
            expect(source.baseUrl).toBe('https://api.mangadex.org')
        })

        it('should have correct name', () => {
            expect(source.name).toBe('MangaDex')
        })

        it('should have version defined', () => {
            expect(source.version).toBeDefined()
            expect(source.version).toBe('1.0.0')
        })

        it('should have description', () => {
            expect(source.description).toBeDefined()
        })

        it('should have icon URL', () => {
            expect(source.icon).toBe('https://mangadex.org/favicon.ico')
        })

        it('should have correct capabilities', () => {
            expect(source.supportsSearch).toBe(true)
            expect(source.supportsLatest).toBe(true)
            expect(source.supportsPopular).toBe(true)
            expect(source.supportsFilters).toBe(true)
            expect(source.supportsTrending).toBe(false)
        })

        it('should have languages defined', () => {
            expect(source.languages).toBeDefined()
            expect(source.languages).toContain('en')
        })
    })

    describe('Required Methods', () => {
        it('should have search method defined', () => {
            expect(source.search).toBeDefined()
            expect(typeof source.search).toBe('function')
        })

        it('should have getMangaDetails method defined', () => {
            expect(source.getMangaDetails).toBeDefined()
            expect(typeof source.getMangaDetails).toBe('function')
        })

        it('should have getChapters method defined', () => {
            expect(source.getChapters).toBeDefined()
            expect(typeof source.getChapters).toBe('function')
        })

        it('should have getChapterPages method defined', () => {
            expect(source.getChapterPages).toBeDefined()
            expect(typeof source.getChapterPages).toBe('function')
        })

        it('should have getLatest method defined', () => {
            expect(source.getLatest).toBeDefined()
            expect(typeof source.getLatest).toBe('function')
        })

        it('should have getPopular method defined', () => {
            expect(source.getPopular).toBeDefined()
            expect(typeof source.getPopular).toBe('function')
        })
    })

    describe('Search Functionality', () => {
        it('should search and return manga array', async () => {
            const results = await source.search(searchTerm)
            
            expect(results).toBeDefined()
            expect(Array.isArray(results)).toBe(true)
            expect(results.length).toBeGreaterThan(0)
        }, 10000)

        it('should return manga with correct structure', async () => {
            const results = await source.search(searchTerm)
            const manga = results[0]
            
            expect(manga).toBeDefined()
            expect(manga.id).toBeDefined()
            expect(manga.title).toBeDefined()
            expect(manga.sourceId).toBe('mangadex')
            expect(manga.url).toContain('mangadex.org/title/')
        }, 10000)

        it('should return manga with optional fields', async () => {
            const results = await source.search(searchTerm)
            const manga = results[0]
            
            // Optional fields that may or may not be present
            if (manga.coverUrl) {
                expect(manga.coverUrl).toContain('uploads.mangadex.org/covers/')
            }
            
            if (manga.author) {
                expect(typeof manga.author).toBe('string')
            }
            
            if (manga.artist) {
                expect(typeof manga.artist).toBe('string')
            }
            
            if (manga.genres) {
                expect(Array.isArray(manga.genres)).toBe(true)
            }
            
            if (manga.status) {
                expect(['ongoing', 'completed', 'hiatus', 'cancelled', 'unknown']).toContain(manga.status)
            }
            
            if (manga.rating) {
                expect(['safe', 'suggestive', 'erotica', 'pornographic']).toContain(manga.rating)
            }
        }, 10000)

        it('should handle search with pagination options', async () => {
            const results = await source.search(searchTerm, { limit: 5, page: 1 })
            
            expect(results).toBeDefined()
            expect(Array.isArray(results)).toBe(true)
            expect(results.length).toBeLessThanOrEqual(5)
        }, 10000)

        it('should handle empty search query', async () => {
            const results = await source.search('', { limit: 10 })
            
            expect(results).toBeDefined()
            expect(Array.isArray(results)).toBe(true)
        }, 10000)
    })

    describe('Manga Details', () => {
        it('should get manga details by ID', async () => {
            const manga = await source.getMangaDetails(testMangaId)
            
            expect(manga).toBeDefined()
            expect(manga.id).toBe(testMangaId)
            expect(manga.title).toBeDefined()
            expect(manga.sourceId).toBe('mangadex')
            expect(manga.url).toBe(`https://mangadex.org/title/${testMangaId}`)
        }, 10000)

        it('should have complete manga metadata', async () => {
            const manga = await source.getMangaDetails(testMangaId)
            
            expect(manga.coverUrl).toBeDefined()
            expect(manga.author).toBeDefined()
            expect(manga.artist).toBeDefined()
            expect(manga.genres).toBeDefined()
            expect(Array.isArray(manga.genres)).toBe(true)
            expect(manga.description).toBeDefined()
        }, 10000)
    })

    describe('Chapters Functionality', () => {
        it('should get chapters for a manga', async () => {
            const chapters = await source.getChapters(testMangaId)
            
            expect(chapters).toBeDefined()
            expect(Array.isArray(chapters)).toBe(true)
            expect(chapters.length).toBeGreaterThan(0)
        }, 15000)

        it('should return chapters with correct structure', async () => {
            const chapters = await source.getChapters(testMangaId)
            const chapter = chapters[0]
            
            expect(chapter).toBeDefined()
            expect(chapter.id).toBeDefined()
            expect(chapter.title).toBeDefined()
            expect(chapter.url).toContain('mangadex.org/chapter/')
            expect(chapter.language).toBe('en')
        }, 15000)

        it('should have chapter metadata', async () => {
            const chapters = await source.getChapters(testMangaId)
            const chapter = chapters[0]
            
            expect(chapter.pages).toBeDefined()
            expect(typeof chapter.pages).toBe('number')
            expect(chapter.pages).toBeGreaterThan(0)
            
            expect(chapter.date).toBeDefined()
            
            // Optional fields
            if (chapter.number !== undefined) {
                expect(typeof chapter.number).toBe('number')
            }
            
            if (chapter.volume !== undefined) {
                expect(typeof chapter.volume).toBe('number')
            }
            
            if (chapter.scanlator) {
                expect(typeof chapter.scanlator).toBe('string')
            }
        }, 15000)

        it('should handle pagination when fetching chapters', async () => {
            const chaptersPage1 = await source.getChapters(testMangaId, 0, 5)
            
            expect(chaptersPage1).toBeDefined()
            expect(Array.isArray(chaptersPage1)).toBe(true)
        }, 15000)
    })

    describe('Chapter Pages Functionality', () => {
        it('should get pages for a chapter', async () => {
            const pages = await source.getChapterPages(testChapterId)
            
            expect(pages).toBeDefined()
            expect(Array.isArray(pages)).toBe(true)
            expect(pages.length).toBeGreaterThan(0)
        }, 10000)

        it('should return pages with correct structure', async () => {
            const pages = await source.getChapterPages(testChapterId)
            const page = pages[0]
            
            expect(page).toBeDefined()
            expect(page.index).toBe(0)
            expect(page.imageUrl).toBeDefined()
            expect(page.imageUrl).toContain('.mangadex.network/data/')
            expect(page.imageUrl).toContain('.jpg')
        }, 10000)

        it('should have Referer header for pages', async () => {
            const pages = await source.getChapterPages(testChapterId)
            const page = pages[0]
            
            expect(page.headers).toBeDefined()
            expect(page.headers?.Referer).toBe('https://mangadex.org/')
        }, 10000)

        it('should have sequential page indices', async () => {
            const pages = await source.getChapterPages(testChapterId)
            
            pages.forEach((page, idx) => {
                expect(page.index).toBe(idx)
            })
        }, 10000)
    })

    describe('Latest Manga', () => {
        it('should get latest manga', async () => {
            const latest = await source.getLatest({ limit: 10 })
            
            expect(latest).toBeDefined()
            expect(Array.isArray(latest)).toBe(true)
            expect(latest.length).toBeGreaterThan(0)
            expect(latest.length).toBeLessThanOrEqual(10)
        }, 10000)

        it('should return latest manga with correct structure', async () => {
            const latest = await source.getLatest({ limit: 5 })
            const manga = latest[0]
            
            expect(manga).toBeDefined()
            expect(manga.id).toBeDefined()
            expect(manga.title).toBeDefined()
            expect(manga.sourceId).toBe('mangadex')
        }, 10000)
    })

    describe('Popular Manga', () => {
        it('should get popular manga', async () => {
            const popular = await source.getPopular({ limit: 10 })
            
            expect(popular).toBeDefined()
            expect(Array.isArray(popular)).toBe(true)
            expect(popular.length).toBeGreaterThan(0)
            expect(popular.length).toBeLessThanOrEqual(10)
        }, 10000)

        it('should return popular manga with correct structure', async () => {
            const popular = await source.getPopular({ limit: 5 })
            const manga = popular[0]
            
            expect(manga).toBeDefined()
            expect(manga.id).toBeDefined()
            expect(manga.title).toBeDefined()
            expect(manga.sourceId).toBe('mangadex')
        }, 10000)
    })

    describe('Error Handling', () => {
        it('should handle invalid manga ID', async () => {
            await expect(async () => {
                await source.getMangaDetails('invalid-id-12345')
            }).rejects.toThrow()
        }, 10000)

        it('should handle invalid chapter ID', async () => {
            await expect(async () => {
                await source.getChapterPages('invalid-chapter-id')
            }).rejects.toThrow()
        }, 10000)

        it('should handle external chapter URLs', async () => {
            // Some chapters are hosted externally (e.g., MangaPlus)
            // The implementation should throw a specific error for these
            // This test would need a known external chapter ID
            // For now, we just verify the method exists and handles errors
            expect(source.getChapterPages).toBeDefined()
        })
    })
})