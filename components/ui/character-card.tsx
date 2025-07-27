"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Trash2 } from "lucide-react"

interface Character {
  id: string
  name: string
  age: string
  gender: string
  image?: string
}

interface CharacterCardProps {
  character: Character
  onUpdate: (id: string, field: keyof Character, value: string) => void
  onRemove: (id: string) => void
  isRemovable: boolean
}

export function CharacterCard({ character, onUpdate, onRemove, isRemovable }: CharacterCardProps) {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        onUpdate(character.id, "image", e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 p-4 border rounded-lg bg-gray-50">
      {/* 角色图片上传 */}
      <div className="flex flex-col items-center mr-4">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2">
          {character.image ? (
            <img src={character.image} alt="角色图片" className="w-full h-full object-cover" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id={`char-img-upload-${character.id}`}
        />
        <label htmlFor={`char-img-upload-${character.id}`}>
          <Button asChild size="sm" variant="outline" className="cursor-pointer">
            <span>{character.image ? "更换图片" : "上传图片"}</span>
          </Button>
        </label>
      </div>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div>
          <Label htmlFor={`name-${character.id}`}>姓名 *</Label>
          <Input
            id={`name-${character.id}`}
            value={character.name}
            onChange={(e) => onUpdate(character.id, "name", e.target.value)}
            placeholder="角色姓名"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`age-${character.id}`}>年龄</Label>
          <Input
            id={`age-${character.id}`}
            value={character.age}
            onChange={(e) => onUpdate(character.id, "age", e.target.value)}
            placeholder="角色年龄"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`gender-${character.id}`}>性别</Label>
          <Select
            value={character.gender}
            onValueChange={(value) => onUpdate(character.id, "gender", value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="选择性别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">男</SelectItem>
              <SelectItem value="female">女</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isRemovable && (
        <Button variant="outline" size="sm" onClick={() => onRemove(character.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}