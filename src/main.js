import * as fs from 'fs'
import * as path from 'path'
import * as core from '@actions/core'
import * as http from '@actions/http-client'
import * as io from '@actions/io'

const USER_AGENT = 'https://github.com/BenjaminMoran/download-minecraft-action'
const VERSION_MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'

try {
  setOutputs(await main(getInputs()))
} catch (error) {
  if (error instanceof Error) core.setFailed(error.message)
}

function getInputs() {
  const version = core.getInput('version', { required: true })
  const files = core.getInput('files', { required: true }).split(' ')
  const destination = core.getInput('destination') || '.'
  return { version, files, destination }
}

function setOutputs(outputs) {
  core.setOutput('output-paths', outputs.outputPaths.join('\n'))
}

async function main(inputs) {
  const { version, files, destination } = inputs

  const httpClient = new http.HttpClient(USER_AGENT)

  core.debug('Downloading version manifest')
  const versionManifest = (await httpClient.getJson(VERSION_MANIFEST_URL)).result
  if (versionManifest == null) throw Error('Failed to download version manifest')

  const metadata = versionManifest.versions.find(metadata => metadata.id == version)
  if (metadata == null) throw new Error(`No versions match '${version}'`)

  core.debug(`Downloading version data for ${version}`)
  const versionData = (await httpClient.getJson(metadata.url)).result
  if (versionData == null) throw new Error(`Failed to download version data`)
  core.info(`Found Minecraft version ${version}`)

  files.forEach(fileKey => {
    if (!(fileKey in versionData.downloads)) {
      throw new Error(`No download available for key ${fileKey} on version ${version}`)
    }
  })

  const outputPaths = await Promise.all(files.map(fileKey =>
    downloadFile(httpClient, fileKey, versionData.downloads[fileKey].url, destination)
  ))
  core.info(`Downloaded ${files.length} Minecraft files`)

  return { outputPaths }
}

async function downloadFile(httpClient, key, url, outputDir) {
  const extension = key.endsWith('_mappings') ? 'txt' : 'jar'
  const outputPath = path.join(outputDir, key + '.' + extension)
  core.debug(`Downloading ${url} to ${outputPath}`)

  io.mkdirP(outputDir)
  const response = await httpClient.get(url)
  if (response.message.statusCode !== 200) {
    throw new Error(`Failed to download ${key} from ${url}`)
  }
  response.message.pipe(fs.createWriteStream(outputPath))

  core.debug(`Downloaded ${url} to ${outputPath}`)
  return outputPath
}
