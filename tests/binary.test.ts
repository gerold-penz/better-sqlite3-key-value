import { afterAll, beforeAll, expect, test } from "@jest/globals"
import { join, resolve } from "node:path"
import { tmpdir } from 'node:os'
import { mkdtempSync, rmdirSync } from 'node:fs'
import { rmSync, existsSync } from "node:fs"
import { BetterSqlite3KeyValue } from "../src"


let tmpDirname: string
let sourceImagePath: string
let targetImagePath: string
let dbPath: string


beforeAll(async () => {
    sourceImagePath = resolve(join(__dirname, "..", "assets", "bun.png"))
    tmpDirname = mkdtempSync(join(tmpdir(), "bun-sqlite-key-value"))
    targetImagePath = join(tmpDirname, "bun.png")
    dbPath = join(tmpDirname, "filesystemtest.sqlite")
    console.log(`SQLite database path: "${dbPath}"`)
    console.log(`Source file path: "${sourceImagePath}"`)
    console.log(`Target file path: "${targetImagePath}"`)
})


test("Write an read binary (async)", async () => {
    const store: BetterSqlite3KeyValue = new BetterSqlite3KeyValue(dbPath)

    // Read source file from filesystem
    const sourceFile = Bun.file(sourceImagePath)
    console.log("Original file size:", sourceFile.size)

    // Create ArrayBuffer from source file
    const sourceArrayBuffer = await sourceFile.arrayBuffer()
    console.log("Source ArrayBuffer size:", sourceArrayBuffer.byteLength)

    // Write ArrayBuffer into database
    store.set(sourceImagePath, sourceArrayBuffer)

    // Read ArrayBuffer from database
    const targetArrayBuffer = store.get(sourceImagePath)
    console.log("Target ArrayBuffer size:", targetArrayBuffer.byteLength)

    // Write target file to filesystem (into temporary directory)
    await Bun.write(Bun.file(targetImagePath), targetArrayBuffer)

    // Compare source file with target file
    const targetfile = Bun.file(targetImagePath)
    expect(
        await Bun.file(sourceImagePath).arrayBuffer()
    ).toEqual(
        await Bun.file(targetImagePath).arrayBuffer()
    )
})


afterAll(() => {
    // Remove all
    const glob = new Bun.Glob("*")
    for await (const fileName of glob.scan({cwd: tmpDirname})) {
        const filePath = join(tmpDirname, fileName)
        rmSync(filePath)
    }
    if (existsSync(tmpDirname)) {
        rmdirSync(tmpDirname)
    }
})
