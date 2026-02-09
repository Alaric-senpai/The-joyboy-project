// @ts-nocheck
import { describe, expect, it, beforeAll } from 'vitest'
import ManhuaFastSource from '../index'

describe('ManhuaFast Source Tests', () => {
    let source: ManhuaFastSource

    beforeAll(() => {
        source = new ManhuaFastSource()
    })

    describe('Source Metadata', () => {
        it('should have correct source ID', () => {
            expect(source.id).toBe('manhuafast')
        })

        it('should have correct base URL', () => {
            expect(source.baseUrl).toBe('https://manhuafast.net')
        })

        it('should have correct name', () => {
            expect(source.name).toBe('ManhuaFast')
        })

        it('should have version defined', () => {
            expect(source.version).toBeDefined()
            expect(source.version).toBe('1.0.0')
        })

        it('should have description', () => {
            expect(source.description).toBeDefined()
        })

        it('should have icon URL', () => {
            expect(source.icon).toBeDefined()
            expect(source.icon).toContain('manhuafast.net')
        })

        it('should have correct capabilities', () => {
            expect(source.supportsSearch).toBe(true)
            expect(source.supportsLatest).toBe(true)
            expect(source.supportsPopular).toBe(true)
            expect(source.supportsFilters).toBe(true)
            expect(source.supportsTrending).toBe(true)
        })

        it('should have languages defined', () => {
            expect(source.languages).toBeDefined()
            expect(Array.isArray(source.languages)).toBe(true)
            expect(source.languages).toContain('en')
        })

        it('should have nsfw flag defined', () => {
            expect(source.isNsfw).toBeDefined()
            expect(source.isNsfw).toBe(false)
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

        it('should have extractPaginationInfo method defined', () => {
            expect(source.extractPaginationInfo).toBeDefined()
            expect(typeof source.extractPaginationInfo).toBe('function')
        })

        it('should have getByPage method defined', () => {
            expect(source.getByPage).toBeDefined()
            expect(typeof source.getByPage).toBe('function')
        })

        it('should have listAll method defined', () => {
            expect(source.listAll).toBeDefined()
            expect(typeof source.listAll).toBe('function')
        })

        it('should have listGenres method defined', () => {
            expect(source.listGenres).toBeDefined()
            expect(typeof source.listGenres).toBe('function')
        })
    })

    describe('Integration Tests', () => {
        describe('search()', () => {
            it('should return search results for a query', async () => {
                const results = await source.search('martial')

                expect(results).toBeDefined()
                expect(Array.isArray(results)).toBe(true)
                expect(results.length).toBeGreaterThan(0)

                // Check first result structure
                const firstResult = results[0]
                expect(firstResult.id).toBeDefined()
                expect(firstResult.title).toBeDefined()
                expect(firstResult.sourceId).toBe('manhuafast')
            }, 10000)

            it('should handle pagination in search', async () => {
                const page1 = await source.search('action', { page: 1 })
                const page2 = await source.search('action', { page: 2 })

                expect(page1).toBeDefined()
                expect(page2).toBeDefined()
                expect(page1[0]?.id).not.toBe(page2[0]?.id)
            }, 10000)
        })

        describe('listAll()', () => {
            it('should return list of manga', async () => {
                const results = await source.listAll()

                expect(results).toBeDefined()
                expect(Array.isArray(results)).toBe(true)
                expect(results.length).toBeGreaterThan(0)

                // Check structure
                const firstManga = results[0]
                expect(firstManga.id).toBeDefined()
                expect(firstManga.title).toBeDefined()
                expect(firstManga.sourceId).toBe('manhuafast')
            }, 10000)

            it('should handle pagination', async () => {
                const page1 = await source.listAll({ page: 1 })
                const page2 = await source.listAll({ page: 2 })

                expect(page1).toBeDefined()
                expect(page2).toBeDefined()
                expect(page1.length).toBeGreaterThan(0)
                expect(page2.length).toBeGreaterThan(0)
            }, 10000)
        })

        describe('getMangaDetails()', () => {
            it('should return detailed manga information', async () => {
                const mangaId = 'the-indomitable-martial-king'
                const details = await source.getMangaDetails(mangaId)

                expect(details).toBeDefined()
                expect(details.id).toBe(mangaId)
                expect(details.title).toBeDefined()
                expect(details.description).toBeDefined()
                expect(details.sourceId).toBe('manhuafast')
                expect(details.genres).toBeDefined()
                expect(Array.isArray(details.genres)).toBe(true)
                expect(details.status).toBeDefined()
            }, 10000)
        })

        describe('getChapters()', () => {
            it('should return chapters for a manga', async () => {
                const mangaId = 'the-indomitable-martial-king'
                const chapters = await source.getChapters(mangaId)

                expect(chapters).toBeDefined()
                expect(Array.isArray(chapters)).toBe(true)
                expect(chapters.length).toBeGreaterThan(0)

                // Check chapter structure
                const firstChapter = chapters[0]
                expect(firstChapter.id).toBeDefined()
                expect(firstChapter.title).toBeDefined()
                expect(firstChapter.url).toBeDefined()
                expect(firstChapter.url).toContain(mangaId)
            }, 10000)

            it('should return all chapters without pagination', async () => {
                const mangaId = 'heavenly-jewel-change'
                const chapters = await source.getChapters(mangaId)

                // This manga has 160+ chapters, verify we get them all
                expect(chapters.length).toBeGreaterThan(100)
            }, 10000)
        })

        describe('getChapterPages()', () => {
            it('should return pages for a chapter', async () => {
                const chapterId = 'the-indomitable-martial-king/chapter-1'
                const pages = await source.getChapterPages(chapterId)

                expect(pages).toBeDefined()
                expect(Array.isArray(pages)).toBe(true)
                expect(pages.length).toBeGreaterThan(0)

                // Check page structure
                const firstPage = pages[0]
                expect(firstPage.index).toBeDefined()
                expect(firstPage.imageUrl).toBeDefined()
                expect(firstPage.imageUrl).toMatch(/^https?:\/\//)
            }, 10000)
        })

        describe('listGenres()', () => {
            it('should return list of genres', async () => {
                const genres = await source.listGenres()

                expect(genres).toBeDefined()
                expect(Array.isArray(genres)).toBe(true)
                expect(genres.length).toBeGreaterThan(0)

                // Check genre structure
                const firstGenre = genres[0]
                expect(firstGenre.label).toBeDefined()
                expect(firstGenre.id).toBeDefined()
            }, 10000)

            it('should return at least 40 genres', async () => {
                const genres = await source.listGenres()

                // We know the site has 46 genres
                expect(genres.length).toBeGreaterThanOrEqual(40)
            }, 10000)

            it('should have genres sorted alphabetically', async () => {
                const genres = await source.listGenres()

                // Check if sorted
                for (let i = 1; i < genres.length; i++) {
                    expect(genres[i].label.localeCompare(genres[i - 1].label)).toBeGreaterThanOrEqual(0)
                }
            }, 10000)
        })

        describe('getByPage()', () => {
            it('should return manga for a specific genre', async () => {
                const results = await source.getByPage('action', 1)

                expect(results).toBeDefined()
                expect(Array.isArray(results)).toBe(true)
                expect(results.length).toBeGreaterThan(0)

                const firstManga = results[0]
                expect(firstManga.id).toBeDefined()
                expect(firstManga.title).toBeDefined()
            }, 10000)
        })

        describe('extractPaginationInfo()', () => {
            it('should extract pagination information', async () => {
                const url = `${source.baseUrl}/manga/page/1/`
                const paginationInfo = await source.extractPaginationInfo(url)

                expect(paginationInfo).toBeDefined()
                expect(paginationInfo.totalPages).toBeDefined()
                expect(paginationInfo.totalPages).toBeGreaterThan(0)
            }, 10000)
        })
    })

    describe('Error Handling', () => {
        it('should throw error for invalid manga ID', async () => {
            await expect(source.getMangaDetails('invalid-manga-id-that-does-not-exist-12345')).rejects.toThrow()
        }, 10000)

        it('should throw error for invalid chapter ID', async () => {
            await expect(source.getChapterPages('invalid-manga/invalid-chapter')).rejects.toThrow()
        }, 10000)

        it('should handle empty search results gracefully', async () => {
            const results = await source.search('xyzabc123nonexistent')
            expect(Array.isArray(results)).toBe(true)
            // Empty results should return empty array, not throw
        }, 10000)
    })
})
