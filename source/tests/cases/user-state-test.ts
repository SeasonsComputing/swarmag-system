/** User draft notes retain independent metadata and isolate source records. */

import type { Note } from '@domain/abstractions/common.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import { createUserState, userDraft } from '@front/app-admin/users/user-state.ts'
import { assertEquals, assertNotStrictEquals } from '@std/assert'
import { administratorUserSample } from '@tests/fixtures/user-samples.ts'

Deno.test('User draft preserves independent notes and isolates source and projected metadata', () => {
  const notes: Note[] = [
    {
      content: 'Internal history',
      visibility: 'internal',
      createdAt: '2026-10-01T12:00:00.000Z',
      attachments: []
    },
    {
      content: 'Shared history',
      visibility: 'shared',
      createdAt: '2026-10-02T12:00:00.000Z',
      attachments: [{
        filename: 'history.pdf',
        url: 'https://example.com/history.pdf',
        contentType: 'application/pdf',
        kind: 'document',
        uploadedAt: '2026-10-02T12:00:00.000Z'
      }]
    }
  ]
  const user = { ...administratorUserSample, notes }
  const state = createUserState(user)
  assertEquals(userDraft(state).notes, notes)
  notes[0].content = 'Changed source'
  assertEquals(state.notes()[0].content, 'Internal history')
  const projected = userDraft(state)
  projected.notes[1].attachments[0].filename = 'Changed projection'
  assertEquals(state.notes()[1].attachments[0].filename, 'history.pdf')
  state.setNotes(state.notes().map((note, index) => index === 0 ? { ...note, content: 'Edited' } : note))
  assertEquals(userDraft(state).notes[0].content, 'Edited')
  assertEquals(userDraft(state).notes[1].visibility, 'shared')
  state.setNotes([])
  assertEquals(userDraft(state).notes, [])
})

Deno.test('New User draft begins with an empty notes collection', () => {
  assertEquals(userDraft(createUserState(null)).notes, [])
})

Deno.test('User draft copies accepted notes and roles and isolates projected roles', () => {
  const roles: UserRole[] = ['administrator']
  const user = { ...structuredClone(administratorUserSample), roles }
  const state = createUserState(user)
  user.roles.push('operations')
  assertEquals(state.roles(), ['administrator'])
  const projected = userDraft(state)
  assertNotStrictEquals(projected.roles, state.roles())
  state.roles().push('customer')
  assertEquals(projected.roles, ['administrator'])
  state.setRoles(roles)
  roles.length = 0
  assertEquals(state.roles(), ['administrator', 'operations'])
  const notes: Note[] = [{
    content: 'Accepted',
    visibility: 'internal',
    attachments: [],
    createdAt: '2026-10-08T12:00:00Z'
  }]
  state.setNotes(notes)
  notes[0].content = 'Input edit'
  assertEquals(state.notes()[0].content, 'Accepted')
})
