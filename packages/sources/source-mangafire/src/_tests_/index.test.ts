// @ts-nocheck
import { describe, expect, it, beforeAll } from 'vitest'
import MangafireSource from '../index'

describe('Mangafire Source Tests', () => {
    let source: MangafireSource

    beforeAll(() => {
        source = new MangafireSource()
    })

    describe('Source Metadata', () => {
        it('should have correct source ID', () => {
            expect(source.id).toBe('mangafire')
        })

        it('should have correct base URL', () => {
            expect(source.baseUrl).toBe('https://mangafire.to')
        })

        it('should have correct name', () => {
            expect(source.name).toBe('Mangafire')
        })

        it('should have version defined', () => {
            expect(source.version).toBeDefined()
            expect(source.version).toBe('1.0.0')
        })

        it('should have description', () => {
            expect(source.description).toBeDefined()
        })

        // Optional: Uncomment if icon is set
        // it('should have icon URL', () => {
        //     expect(source.icon).toBeDefined()
        // })

        it('should have correct capabilities', () => {
            expect(source.supportsSearch).toBeDefined()
            expect(source.supportsLatest).toBeDefined()
            expect(source.supportsPopular).toBeDefined()
            expect(source.supportsFilters).toBeDefined()
            expect(source.supportsTrending).toBeDefined()
        })

        it('should have languages defined', () => {
            expect(source.languages).toBeDefined()
            expect(Array.isArray(source.languages)).toBe(true)
        })

        it('should have nsfw flag defined', () => {
            expect(source.isNsfw).toBeDefined()
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
})
