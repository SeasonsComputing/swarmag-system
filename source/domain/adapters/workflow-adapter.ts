/**
 * Workflow et al adapters to and from Dictionary representation
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type {
  Answer,
  Question,
  QuestionOption,
  Task,
  Workflow
} from '@domain/abstractions/workflow.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Create a QuestionOption from serialized dictionary format */
export const toQuestionOption = (dict: Dictionary): QuestionOption => ({
  value: dict.value as string,
  label: dict.label as string | undefined,
  requiresNote: dict.requires_note as boolean | undefined
})

/** Serialize a QuestionOption to dictionary format */
export const fromQuestionOption = (option: QuestionOption): Dictionary => ({
  value: option.value,
  label: option.label,
  requires_note: option.requiresNote
})

/** Create a Question from serialized dictionary format */
export const toQuestion = (dict: Dictionary): Question => ({
  id: dict.id as string,
  prompt: dict.prompt as string,
  type: dict.type as Question['type'],
  helpText: dict.help_text as string | undefined,
  required: dict.required as boolean | undefined,
  options: ((dict.options as Dictionary[]) ?? []).map(toQuestionOption)
})

/** Serialize a Question to dictionary format */
export const fromQuestion = (question: Question): Dictionary => ({
  id: question.id,
  prompt: question.prompt,
  type: question.type,
  help_text: question.helpText,
  required: question.required,
  options: question.options.map(fromQuestionOption)
})

/** Create an Answer from serialized dictionary format */
export const toAnswer = (dict: Dictionary): Answer => ({
  questionId: dict.question_id as string,
  value: dict.value as Answer['value'],
  capturedAt: dict.captured_at as string,
  capturedById: dict.captured_by_id as string,
  notes: ((dict.notes as Dictionary[]) ?? []).map(toNote)
})

/** Serialize an Answer to dictionary format */
export const fromAnswer = (answer: Answer): Dictionary => ({
  question_id: answer.questionId,
  value: answer.value,
  captured_at: answer.capturedAt,
  captured_by_id: answer.capturedById,
  notes: answer.notes.map(fromNote)
})

/** Create a Task from serialized dictionary format */
export const toTask = (dict: Dictionary): Task => ({
  id: dict.id as string,
  title: dict.title as string,
  description: dict.description as string | undefined,
  checklist: ((dict.checklist as Dictionary[]) ?? []).map(toQuestion) as Task['checklist']
})

/** Serialize a Task to dictionary format */
export const fromTask = (task: Task): Dictionary => ({
  id: task.id,
  title: task.title,
  description: task.description,
  checklist: task.checklist.map(fromQuestion)
})

/** Create a Workflow from serialized dictionary format */
export const toWorkflow = (dict: Dictionary): Workflow => {
  if (!dict.id) return notValid('Workflow dictionary missing required field: id')
  if (!dict.name) return notValid('Workflow dictionary missing required field: name')
  return {
    id: dict.id as string,
    name: dict.name as string,
    description: dict.description as string | undefined,
    version: dict.version as number,
    tags: (dict.tags as string[]) ?? [],
    tasks: ((dict.tasks as Dictionary[]) ?? []).map(toTask) as Workflow['tasks'],
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a Workflow to dictionary format */
export const fromWorkflow = (workflow: Workflow): Dictionary => ({
  id: workflow.id,
  name: workflow.name,
  description: workflow.description,
  version: workflow.version,
  tags: workflow.tags,
  tasks: workflow.tasks.map(fromTask),
  created_at: workflow.createdAt,
  updated_at: workflow.updatedAt,
  deleted_at: workflow.deletedAt
})
