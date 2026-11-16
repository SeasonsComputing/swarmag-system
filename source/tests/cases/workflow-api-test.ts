/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workflow API stage tests                                                     ║
║ Verify workflow CRUD and ordered junction persistence through real RLS.      ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import '../config/stage-config.ts'
import type { Id, Instance } from '@core/std'
import { listAll, makeAdaptedScope } from '@core/stdx'
import type { ApiOrderedJunctionContract, CrudListContract } from '@core/stdx'
import { QuestionAdapter, TaskAdapter, WorkflowAdapter } from '@domain/adapters/workflow-adapter.ts'
import { assert, assertEquals } from '@std/assert'
import { StageSession } from '../fixtures/stage-session.ts'

const { api } = await import('@front/api/api.ts')

Deno.test('workflow clients persist CRUD and ordered membership on stage', async () => {
  await StageSession.run(async () => {
    const nonce = Date.now().toString()
    const workflows: Id[] = []
    const tasks: Id[] = []
    const questions: Id[] = []
    const failures: unknown[] = []
    try {
      const workflow = await api.Workflows.create({
        name: `Stage workflow ${nonce}`,
        version: '1.0',
        notes: [],
        facets: []
      })
      workflows.push(workflow.id)
      assertEquals((await api.Workflows.get(workflow.id)).version, '1.0')
      const version = makeAdaptedScope({
        fields: [WorkflowAdapter.version],
        defaults: {
          name: 'Unused create default',
          notes: [],
          facets: []
        }
      })
      await api.Workflows.update(version.adapter, version.toUpdate(workflow.id, { version: '1.1' }))
      assertEquals((await api.Workflows.get(workflow.id)).version, '1.1')
      assert(await containsRecord(api.Workflows, workflow.id))

      for (let index = 0; index < 3; index++) {
        const task = await api.Tasks.create({ label: `Stage task ${nonce} ${index}`, notes: [] })
        tasks.push(task.id)
      }
      const label = makeAdaptedScope({ fields: [TaskAdapter.label], defaults: { notes: [] } })
      await api.Tasks.update(label.adapter, label.toUpdate(tasks[0], { label: `Updated task ${nonce}` }))
      assertEquals((await api.Tasks.get(tasks[0])).label, `Updated task ${nonce}`)
      assert(await containsRecord(api.Tasks, tasks[0]))

      const inputs = [
        { type: 'text', prompt: `Text ${nonce}` },
        { type: 'single-select', prompt: `Select ${nonce}`, options: [{ value: 'ready' }] },
        { type: 'boolean', prompt: `Boolean ${nonce}` }
      ] as const
      for (const input of inputs) {
        const question = await api.Questions.create(input)
        questions.push(question.id)
        const fetched = await api.Questions.get(question.id)
        assertEquals(fetched.type, input.type)
        if (fetched.type === 'single-select') assertEquals(fetched.options, [{ value: 'ready' }])
      }
      const prompt = makeAdaptedScope({
        fields: [QuestionAdapter.prompt],
        defaults: { type: 'internal' }
      })
      await api.Questions.update(
        prompt.adapter,
        prompt.toUpdate(questions[0], { prompt: `Updated question ${nonce}` })
      )
      assertEquals((await api.Questions.get(questions[0])).prompt, `Updated question ${nonce}`)
      assert(await containsRecord(api.Questions, questions[0]))

      await verifyOrder(api.WorkflowTasks, workflow.id, tasks)
      await verifyOrder(api.TaskQuestions, tasks[0], questions)
    } catch (error) {
      failures.push(error)
    } finally {
      const attempt = async (action: () => Promise<void>): Promise<void> => {
        try {
          await action()
        } catch (error) {
          failures.push(error)
        }
      }
      // Attempt every cleanup operation and retain the original test failure.
      for (const owner of workflows) await attempt(() => api.WorkflowTasks.replace(owner, []))
      for (const owner of tasks) await attempt(() => api.TaskQuestions.replace(owner, []))
      for (const record of workflows) {
        await attempt(async () => {
          await api.Workflows.delete(record)
          assert((await api.Workflows.get(record)).deletedAt)
          assert(!(await containsRecord(api.Workflows, record)))
        })
      }
      for (const record of tasks) {
        await attempt(async () => {
          await api.Tasks.delete(record)
          assert((await api.Tasks.get(record)).deletedAt)
          assert(!(await containsRecord(api.Tasks, record)))
        })
      }
      for (const record of questions) {
        await attempt(async () => {
          await api.Questions.delete(record)
          assert((await api.Questions.get(record)).deletedAt)
          assert(!(await containsRecord(api.Questions, record)))
        })
      }
    }
    if (failures.length) throw new AggregateError(failures, 'Workflow stage test or cleanup failed')
  })
})

// Read through a fresh client list after every write to prove persisted order.
const verifyOrder = async (
  client: ApiOrderedJunctionContract,
  owner: Id,
  partners: readonly Id[]
): Promise<void> => {
  const [first, second, third] = partners
  await client.replace(owner, [first, second])
  assertEquals(await client.partners(owner), [first, second])
  const list = await client.list(owner)
  await list.add(third)
  assertEquals((await client.list(owner)).items(), [first, second, third])
  await list.moveBack(third)
  assertEquals((await client.list(owner)).items(), [first, third, second])
  await list.moveForward(first)
  assertEquals((await client.list(owner)).items(), [third, first, second])
  await list.remove(first)
  assertEquals((await client.list(owner)).items(), [third, second])
  assertEquals((await client.partnersOf([owner])).get(owner), [third, second])
  await client.replace(owner, [second, third, first])
  assertEquals(await client.partners(owner), [second, third, first])
  await client.replace(owner, [])
  assertEquals(await client.partners(owner), [])
}

// Exhaust every page before reporting absence; stop as soon as the record is found.
const containsRecord = async <T extends Instance>(
  client: CrudListContract<T>,
  id: Id
): Promise<boolean> => {
  for await (const record of listAll(client)) if (record.id === id) return true
  return false
}
