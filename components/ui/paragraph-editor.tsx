"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Edit3, RefreshCw, Check } from "lucide-react"

interface ParagraphEditorProps {
  index: number
  content: string
  onUpdate: (index: number, content: string) => void
  onRegenerate?: (index: number) => void
}

export function ParagraphEditor({ index, content, onUpdate, onRegenerate }: ParagraphEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  const handleSave = () => {
    onUpdate(index, editedContent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  return (
    <div className="group relative p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Badge variant="outline" className="mr-2">
              第 {index + 1} 段
            </Badge>
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={3}
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="mr-2 h-4 w-4" />
                  确认
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 leading-relaxed">{content}</p>
          )}
        </div>
        {!isEditing && (
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4" />
            </Button>
            {onRegenerate && (
              <Button size="sm" variant="outline" onClick={() => onRegenerate(index)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}