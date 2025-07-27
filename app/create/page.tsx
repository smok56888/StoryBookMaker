"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Navigation } from "@/components/ui/navigation"
import { ParagraphCountSelector } from "@/components/ui/paragraph-count-selector"
import { PromptGeneratorButton } from "@/components/ui/prompt-generator-button"
import { ImageGenerator } from "@/components/ui/image-generator"
import { CreationSteps } from "@/components/ui/creation-steps"
import { CharacterCard } from "@/components/ui/character-card"
import { ParagraphEditor } from "@/components/ui/paragraph-editor"
import { PreviewViewer } from "@/components/ui/preview-viewer"
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  Download,
  Eye,
  Wand2,
  ImageIcon,
  FileText,
  Users,
  BookOpen,
  RefreshCw,
  Check
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { generateStory, completeStory, downloadPdf, getStoryDetails } from "@/lib/apiClient"
import { toast } from "sonner"

type Character = {
  id: string
  name: string
  age: string
  gender: string
  image?: string
}

type StoryStep = "setup" | "story" | "images" | "preview"

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState<StoryStep>("setup")
  // 默认有一个角色且不可删除
  const [characters, setCharacters] = useState<Character[]>([
    { id: "main", name: "", age: "", gender: "", image: undefined },
  ])
  const [storyOutline, setStoryOutline] = useState("")
  const [storyStyle, setStoryStyle] = useState("")
  const [paragraphCount, setParagraphCount] = useState(5)
  const [generatedStory, setGeneratedStory] = useState<string[]>([])
  const [storyTitle, setStoryTitle] = useState("")
  const [storyId, setStoryId] = useState("")
  const [editingParagraph, setEditingParagraph] = useState<number | null>(null)
  const [imageStage, setImageStage] = useState<"cover" | "content" | "ending">("cover")
  const [generatedImages, setGeneratedImages] = useState<{
    cover?: string
    content: string[]
    ending?: string
  }>({ content: [] })
  const [prompts, setPrompts] = useState<{
    cover: string
    pages: string[]
    ending: string
  }>({ cover: "", pages: [], ending: "" })
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // 获取URL参数
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  // 加载编辑数据
  useEffect(() => {
    if (editId) {
      loadStoryForEditing(editId);
    }
  }, [editId]);

  // 加载故事数据用于编辑
  const loadStoryForEditing = async (storyId: string) => {
    try {
      setIsLoading(true);
      toast.info('正在加载故事数据...');
      
      const storyData = await getStoryDetails(storyId);
      
      // 设置故事ID
      setStoryId(storyData.storyId);
      
      // 设置角色信息
      if (storyData.characters && storyData.characters.length > 0) {
        const formattedCharacters = storyData.characters.map((char: any, index: number) => ({
          id: index === 0 ? 'main' : `char_${index}`,
          name: char.name || '',
          age: char.age || '',
          gender: char.gender || '',
          image: char.image || undefined
        }));
        setCharacters(formattedCharacters);
      }
      
      // 设置故事内容
      setStoryTitle(storyData.title || '');
      setGeneratedStory(storyData.paragraphs || []);
      
      // 设置提示词
      if (storyData.prompts) {
        setPrompts({
          cover: storyData.prompts.cover || '',
          pages: storyData.prompts.pages || [],
          ending: storyData.prompts.ending || ''
        });
      }
      
      // 设置图片
      if (storyData.images) {
        // 确保content数组长度与段落数量匹配
        const contentImages = storyData.images.content || [];
        const paragraphCount = storyData.paragraphs ? storyData.paragraphs.length : 0;
        
        // 填充或截断content数组以匹配段落数量
        while (contentImages.length < paragraphCount) {
          contentImages.push(undefined);
        }
        contentImages.splice(paragraphCount);
        
        setGeneratedImages({
          cover: storyData.images.cover,
          content: contentImages,
          ending: storyData.images.ending
        });
      }
      
      toast.success('故事数据加载成功');
    } catch (error) {
      toast.error('加载故事数据失败');
      console.error('加载故事数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: "setup", title: "创作设置", description: "上传图片和设置角色信息", icon: FileText },
    { id: "story", title: "故事生成", description: "生成和编辑故事内容", icon: Wand2 },
    { id: "images", title: "插图生成", description: "生成绘本插图", icon: ImageIcon },
    { id: "preview", title: "预览导出", description: "预览和导出绘本", icon: Eye },
  ]

  // 角色相关函数
  const addCharacter = () => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: "",
      age: "",
      gender: "",
      image: undefined,
    }
    setCharacters([...characters, newCharacter])
  }

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    setCharacters(characters.map((char) => (char.id === id ? { ...char, [field]: value } : char)))
  }

  const removeCharacter = (id: string) => {
    if (id === "main") return // 默认角色不可删除
    setCharacters(characters.filter((char) => char.id !== id))
  }

  // 故事生成函数
  const handleGenerateStory = async () => {
    // 验证必要信息
    if (!characters[0].name) {
      toast.error('请填写主角色姓名')
      return
    }
    
    if (!storyOutline.trim()) {
      toast.error('请填写故事梗概')
      return
    }

    setIsGenerating(true)
    toast.info('正在生成故事，这可能需要一些时间，请耐心等待...')
    
    try {
      const result = await generateStory({
        characters: characters.map(char => ({
          name: char.name,
          age: char.age,
          gender: char.gender,
          image: char.image
        })),
        outline: storyOutline,
        style: storyStyle,
        count: paragraphCount
      })

      setStoryId(result.storyId)
      setStoryTitle(result.title)
      setGeneratedStory(result.paragraphs)
      
      // 初始化提示词数组
      setPrompts({
        cover: "",
        pages: Array(result.paragraphs.length).fill(""),
        ending: ""
      })
      
      // 初始化图片数组
      setGeneratedImages({
        cover: undefined,
        content: Array(result.paragraphs.length).fill(undefined),
        ending: undefined
      })
      
      toast.success('故事生成成功')
    } catch (error: any) {
      console.error('故事生成失败:', error)
      
      // 如果是超时错误，给出更明确的提示
      if (error.message && error.message.includes('timeout')) {
        toast.error('故事生成超时，请稍后重试或减少故事复杂度')
      } else {
        toast.error(error.response?.data?.error || '故事生成失败，请重试')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // 段落更新函数
  const updateParagraph = (index: number, content: string) => {
    const newStory = [...generatedStory]
    newStory[index] = content
    setGeneratedStory(newStory)
  }

  // 提示词更新函数
  const updatePrompt = (type: 'cover' | 'content' | 'ending', content: string, index?: number) => {
    if (type === 'cover') {
      setPrompts(prev => ({ ...prev, cover: content }))
    } else if (type === 'ending') {
      setPrompts(prev => ({ ...prev, ending: content }))
    } else if (type === 'content' && index !== undefined) {
      const newPages = [...prompts.pages]
      newPages[index] = content
      setPrompts(prev => ({ ...prev, pages: newPages }))
    }
  }

  // 图片更新函数
  const updateImage = (type: 'cover' | 'content' | 'ending', image: string, index?: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CreatePage] 更新图片 (${type}${index !== undefined ? `-${index}` : ''}):`, image ? '有图片数据' : '无图片数据')
    }
    
    if (type === 'cover') {
      setGeneratedImages(prev => ({ ...prev, cover: image }))
    } else if (type === 'ending') {
      setGeneratedImages(prev => ({ ...prev, ending: image }))
    } else if (type === 'content' && index !== undefined) {
      const newContent = [...generatedImages.content]
      newContent[index] = image
      setGeneratedImages(prev => ({ ...prev, content: newContent }))
    }
  }

  // 提示词生成成功回调
  const handlePromptsGenerated = (result: { cover: string; pages: string[]; ending: string }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CreatePage] 提示词生成成功:', result)
    }
    setPrompts(result)
    toast.success('提示词已自动填充到各个图片生成区域')
  }

  // 完成创作
  const handleCompleteStory = async () => {
    if (!storyId) {
      toast.error('故事ID不能为空')
      return
    }

    try {
      setIsLoading(true)
      await completeStory(storyId)
      toast.success('创作已完成并保存')
      
      // 完成创作后跳转到历史作品页面
      window.location.href = '/history'
    } catch (error: any) {
      toast.error(error.response?.data?.error || '保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 获取步骤进度
  const getStepProgress = () => {
    const stepIndex = steps.findIndex((step) => step.id === currentStep)
    return ((stepIndex + 1) / steps.length) * 100
  }

  // 检查是否可以进入下一步
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case "setup":
        // 确保主角色的姓名、年龄、性别和故事梗概都已填写
        return characters.length > 0 && 
               characters[0].name.trim() !== "" && 
               characters[0].age.trim() !== "" && 
               characters[0].gender.trim() !== "" && 
               storyOutline.trim() !== ""
      case "story":
        // 确保所有段落都有内容
        return generatedStory.length > 0 && 
               generatedStory.every(paragraph => paragraph.trim().length > 0)
      case "images":
        // 确保至少有封面图和一些内容图片
        return generatedStory.length > 0 && 
               generatedImages.cover && 
               generatedImages.content.some(img => img !== undefined)
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">创作您的绘本</h1>
            <div className="flex items-center space-x-4">
              <Progress value={getStepProgress()} className="w-32" />
              <span className="text-sm text-gray-600 font-medium">
                {steps.findIndex((step) => step.id === currentStep) + 1} / {steps.length}
              </span>
            </div>
          </div>

          {/* Step Navigation */}
          <CreationSteps currentStep={currentStep} onStepChange={setCurrentStep} />
        </div>

        {/* Step Content */}
        {currentStep === "setup" && (
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    角色信息
                  </div>
                  <Button onClick={addCharacter} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    添加角色
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {characters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                    <p>还没有添加角色，点击"添加角色"开始设定您的故事人物</p>
                  </div>
                ) : (
                  characters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      onUpdate={updateCharacter}
                      onRemove={removeCharacter}
                      isRemovable={character.id !== "main"}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  故事设定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="story-outline">故事梗概 *</Label>
                  <Textarea
                    id="story-outline"
                    value={storyOutline}
                    onChange={(e) => setStoryOutline(e.target.value)}
                    placeholder="请描述您想要创作的故事大致情节，比如：一个小女孩在森林中的冒险经历..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="story-style">故事风格约束</Label>
                  <Textarea
                    id="story-style"
                    value={storyStyle}
                    onChange={(e) => setStoryStyle(e.target.value)}
                    placeholder="请描述故事的风格要求，如温馨、冒险、教育意义、幽默等..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-between items-end">
                  <ParagraphCountSelector
                    value={paragraphCount}
                    onChange={setParagraphCount}
                    min={1}
                    max={10}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep("story")} size="lg" disabled={!canProceedToNextStep()}>
                下一步：生成故事
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "story" && (
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wand2 className="mr-2 h-5 w-5" />
                    故事内容
                  </div>
                  <Button
                    onClick={handleGenerateStory}
                    disabled={isGenerating}
                    className="relative"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        {generatedStory.length > 0 ? "重新生成" : "生成故事"}
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">AI正在为您创作精彩的故事...</p>
                  </div>
                ) : generatedStory.length === 0 ? (
                  <div className="text-center py-12">
                    <Wand2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">点击"生成故事"开始创作您的绘本故事</p>
                    <p className="text-sm text-gray-400">基于您设定的角色和故事梗概，AI将为您创作独特的故事内容</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {storyTitle && (
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{storyTitle}</h2>
                      </div>
                    )}
                    {generatedStory.map((paragraph, index) => (
                      <ParagraphEditor
                        key={index}
                        index={index}
                        content={paragraph}
                        onUpdate={updateParagraph}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("setup")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                上一步
              </Button>
              <Button onClick={() => setCurrentStep("images")} disabled={!canProceedToNextStep()} size="lg">
                下一步：生成插图
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "images" && (
          <div className="mx-auto max-w-4xl space-y-6">
            {/* 提示词生成按钮 */}
            <div className="flex justify-center mb-4">
              <PromptGeneratorButton
                storyId={storyId}
                onSuccess={handlePromptsGenerated}
                className="w-full md:w-auto"
              />
            </div>

            {/* 调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">调试信息:</h4>
                <p>封面提示词: {prompts.cover ? '已生成' : '未生成'}</p>
                <p>正文提示词: {prompts.pages.filter(p => p).length}/{prompts.pages.length} 已生成</p>
                <p>结尾提示词: {prompts.ending ? '已生成' : '未生成'}</p>
                <p>封面图片: {generatedImages.cover ? '已生成' : '未生成'}</p>
                <p>正文图片: {generatedImages.content.filter(img => img).length}/{generatedImages.content.length} 已生成</p>
                <p>结尾图片: {generatedImages.ending ? '已生成' : '未生成'}</p>
              </div>
            )}

            <div className="flex justify-center space-x-4 mb-8">
              {[
                { id: "cover", title: "封面", icon: BookOpen },
                { id: "content", title: "正文", icon: FileText },
                { id: "ending", title: "结尾", icon: Check },
              ].map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setImageStage(stage.id as any)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                    imageStage === stage.id
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-50 border"
                  }`}
                >
                  <stage.icon className="mr-2 h-4 w-4" />
                  {stage.title}
                </button>
              ))}
            </div>

            {imageStage === "cover" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5" />
                    绘本封面
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageGenerator
                    storyId={storyId}
                    type="cover"
                    prompt={prompts.cover}
                    title={storyTitle}
                    existingImage={generatedImages.cover}
                    onImageGenerated={(image) => updateImage("cover", image)}
                  />
                </CardContent>
              </Card>
            )}

            {imageStage === "content" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    正文插图
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {generatedStory.map((paragraph, index) => (
                      <div key={index} className="border-b pb-8 mb-8 last:border-0 last:pb-0 last:mb-0">
                        <div className="mb-4">
                          <Badge variant="outline" className="mb-2">
                            第 {index + 1} 页
                          </Badge>
                          <p className="text-sm text-gray-600 line-clamp-2">{paragraph}</p>
                        </div>
                        <ImageGenerator
                          storyId={storyId}
                          type="content"
                          index={index}
                          prompt={prompts.pages[index] || ""}
                          title={storyTitle}
                          existingImage={generatedImages.content[index]}
                          onImageGenerated={(image) => updateImage("content", image, index)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {imageStage === "ending" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Check className="mr-2 h-5 w-5" />
                    结尾页
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageGenerator
                    storyId={storyId}
                    type="ending"
                    prompt={prompts.ending}
                    title={storyTitle}
                    existingImage={generatedImages.ending}
                    onImageGenerated={(image) => updateImage("ending", image)}
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("story")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                上一步
              </Button>
              <Button onClick={() => setCurrentStep("preview")} disabled={!canProceedToNextStep()} size="lg">
                下一步：预览绘本
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "preview" && (
          <div className="mx-auto max-w-6xl space-y-6">
            {/* 控制栏 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="mr-2 h-5 w-5" />
                    绘本预览
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCompleteStory} 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          完成创作
                        </>
                      )}
                    </Button>
                    <Button 
                      disabled={!storyId || isLoading}
                      onClick={async () => {
                        if (!storyId) {
                          toast.error('请先完成故事创作');
                          return;
                        }
                        try {
                          await downloadPdf(storyId, storyTitle || '绘本故事');
                        } catch (error) {
                          console.error('PDF下载失败:', error);
                        }
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      导出PDF
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* 绘本预览器 */}
            <PreviewViewer
              title={storyTitle}
              paragraphs={generatedStory}
              images={generatedImages}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("images")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                上一步
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}