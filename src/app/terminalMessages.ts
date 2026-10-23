import type { EditableField, ParseError } from '../engine/types'

const expected: Record<EditableField['type'], string> = {
  int: '정수',
  number: '숫자',
  bool: 'True 또는 False',
  string: '따옴표로 감싼 문자열',
}

function range(field: EditableField): string {
  switch (field.type) {
    case 'int':
      return `${field.options.join(', ')} 중 하나`
    case 'number':
      return `${field.min} 이상 ${field.max} 이하`
    case 'string':
      return `${field.options.map((o) => `"${o}"`).join(', ')} 중 하나`
    case 'bool':
      return 'True 또는 False'
  }
}

/** Python-style error line for one parse error (architecture §6). */
export function parseErrorLine(error: ParseError, field: EditableField): string {
  const got = `(입력: ${error.raw.trim() === '' ? '없음' : error.raw.trim()})`
  switch (error.kind) {
    case 'not_literal':
      return `SyntaxError: ${error.field} 값에는 ${expected[field.type]} 하나만 쓸 수 있습니다 ${got}`
    case 'type_mismatch':
      return `TypeError: ${error.field} 값은 ${expected[field.type]}이어야 합니다 ${got}`
    case 'out_of_range':
      return `ValueError: ${error.field} 값은 ${range(field)}여야 합니다 ${got}`
  }
}
