import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDependencies } from '../../../core/di/dependencies'
import type { CreateTeacherInput } from '../domain/teacher.repository'

const teacherKey = ['teachers'] as const

export function useTeachers() {
  const { teachers } = useDependencies()
  return useQuery({ queryKey: teacherKey, queryFn: () => teachers.list() })
}

export function useCreateTeacher() {
  const { teachers } = useDependencies()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTeacherInput) => teachers.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKey }),
  })
}
