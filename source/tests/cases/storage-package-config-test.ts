/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage build configuration tests                                            ║
║ Verify shared root injection for packaging and direct local serving.         ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { readStorageContract, storageBuildRoot } from '@devops/scripts/storage-contract.ts'
import { assert, assertEquals, assertThrows } from '@std/assert'

Deno.test('builds and local serving validate contract roots', async () => {
  const contract = await readStorageContract('stage')
  const root = contract.stores.attachments.root
  for (const supplied of [undefined, '', root]) assertEquals(storageBuildRoot(contract, supplied), root)
  for (const supplied of ['different-root', '__SECRET__', ' root']) {
    assertThrows(() => storageBuildRoot(contract, supplied))
  }
  assertEquals(storageBuildRoot(contract, undefined, 'fieldBinder'), 'swarmag-field-binder')
  assertThrows(() => storageBuildRoot(contract, 'conflict', 'fieldBinder'))
  for (
    const file of [
      'app-admin-package.sh',
      'app-ops-package.sh',
      'app-customer-package.sh',
      'app-local.sh'
    ]
  ) {
    const script = await Deno.readTextFile(`source/devops/scripts/${file}`)
    const injection = script.indexOf('storage-contract.ts')
    const validation = script.indexOf('REQUIRED_KEYS=()')
    assert(injection >= 0 && injection < validation, `${file} must inject before validation`)
    assert(script.includes('"${TARGET}" "${VITE_ATTACHMENTS_SERVER_ROOT:-}"'))
    assert(script.includes('export VITE_ATTACHMENTS_SERVER_ROOT'))
    assert(script.includes('export VITE_FIELD_BINDER_SERVER_ROOT'))
    assert(script.includes('"${TARGET}" "${VITE_FIELD_BINDER_SERVER_ROOT:-}" fieldBinder'))
    assert(script.indexOf('source "${ENV_FILE}"') < injection)
  }
})

Deno.test({
  name: 'packaging and local serving reject conflicting roots from inherited and sourced environments',
  ignore: !Deno.args.includes('--shell'),
  async fn() {
    const temporary = await Deno.makeTempDir({ prefix: 'binder-package-test-' })
    const repository = Deno.cwd()
    const quote = (value: string) => `'${value.replaceAll('\'', '\'\\\'\'')}'`
    const scripts = `${temporary}/source/devops/scripts`
    const config = `${temporary}/source/front/config`
    const tools = `${temporary}/tools`
    try {
      await Deno.mkdir(scripts, { recursive: true })
      await Deno.mkdir(config, { recursive: true })
      await Deno.mkdir(tools)
      await Deno.writeTextFile(
        `${tools}/deno`,
        `#!/bin/sh\nshift 3\nexec ${quote(Deno.execPath())} run --config ${
          quote(repository + '/deno.jsonc')
        } --allow-read ${quote(repository + '/source/devops/scripts/storage-contract.ts')} "$@"\n`
      )
      await Deno.chmod(`${tools}/deno`, 0o755)
      for (const app of ['admin', 'ops', 'customer']) {
        const file = `app-${app}-package.sh`
        await Deno.copyFile(`source/devops/scripts/${file}`, `${scripts}/${file}`)
      }
      await Deno.copyFile('source/devops/scripts/app-local.sh', `${scripts}/app-local.sh`)
      for (
        const file of [
          'app-admin-package.sh',
          'app-ops-package.sh',
          'app-customer-package.sh',
          'app-local.sh'
        ]
      ) {
        const app = file === 'app-local.sh' ? 'admin' : file.slice(4, -11)
        for (const fromFile of [false, true]) {
          await Deno.writeTextFile(
            `${config}/app-${app}-stage.env`,
            `VITE_PACKAGE_APP_ID=swarmag-app-${app}\nVITE_PACKAGE_TARGET=stage\n`
              + (fromFile ? 'VITE_FIELD_BINDER_SERVER_ROOT=wrong-root\n' : '')
          )
          const result = await new Deno.Command('bash', {
            args: [`${scripts}/${file}`, 'stage', ...(file === 'app-local.sh' ? ['admin'] : [])],
            clearEnv: true,
            env: {
              PATH: `${tools}:/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin`,
              ...(fromFile ? {} : { VITE_FIELD_BINDER_SERVER_ROOT: 'wrong-root' })
            },
            stdout: 'piped',
            stderr: 'piped'
          }).output()
          const output = new TextDecoder().decode(result.stdout)
            + new TextDecoder().decode(result.stderr)
          assertEquals(result.success, false)
          assert(
            output.includes('fieldBinder root conflicts'),
            `${file} (${fromFile ? 'file' : 'inherited'}): ${output}`
          )
        }
      }
    } finally {
      await Deno.remove(temporary, { recursive: true })
    }
  }
})
