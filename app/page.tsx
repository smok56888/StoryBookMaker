import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/ui/navigation"
import { BookOpen, Palette, Download, History, Sparkles, Users } from "lucide-react"

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: "角色定制",
      description: "支持多角色设定，包含姓名、年龄、性别等详细信息，让故事角色更加生动",
      color: "purple",
    },
    {
      icon: Sparkles,
      title: "AI故事生成",
      description: "基于您的创意输入，智能生成完整故事情节，支持段落级别的编辑和重新生成",
      color: "blue",
    },
    {
      icon: Palette,
      title: "插图创作",
      description: "自动生成绘本封面、正文插图和结尾页，支持自定义提示词优化图片效果",
      color: "pink",
    },
    {
      icon: BookOpen,
      title: "实时预览",
      description: "创作过程中随时预览绘本效果，所见即所得的编辑体验",
      color: "green",
    },
    {
      icon: Download,
      title: "PDF导出",
      description: "一键导出高质量PDF文件，支持打印和分享，让您的作品触手可及",
      color: "orange",
    },
    {
      icon: History,
      title: "作品管理",
      description: "按时间线管理您的所有创作，随时回顾和编辑历史作品",
      color: "indigo",
    },
  ]

  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: "bg-purple-100 text-purple-600",
      blue: "bg-blue-100 text-blue-600",
      pink: "bg-pink-100 text-pink-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      indigo: "bg-indigo-100 text-indigo-600",
    }
    return colorMap[color as keyof typeof colorMap] || "bg-gray-100 text-gray-600"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-5xl font-bold text-gray-900 leading-tight">
              创造属于您的
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent block sm:inline">
                专属绘本
              </span>
            </h2>
            <p className="mb-8 text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              通过AI技术，将您的创意转化为精美的绘本故事。从角色设定到故事生成，从插图创作到成品输出，一站式完成您的绘本创作之旅。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 text-lg w-full sm:w-auto"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  开始创作
                </Button>
              </Link>
              <Link href="/history">
                <Button size="lg" variant="outline" className="px-8 py-3 text-lg w-full sm:w-auto bg-transparent">
                  <History className="mr-2 h-5 w-5" />
                  查看作品
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-3xl font-bold text-gray-900">平台功能特色</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              简单易用的创作流程，专业级的输出效果，让每个人都能成为绘本创作者
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 bg-white/60 backdrop-blur-sm transition-all hover:shadow-lg hover:scale-105 duration-300"
              >
                <CardHeader>
                  <div
                    className={`mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${getColorClasses(feature.color)}`}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">1000+</div>
              <div className="text-gray-600">创作作品</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">活跃用户</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600 mb-2">50+</div>
              <div className="text-gray-600">故事模板</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">99%</div>
              <div className="text-gray-600">用户满意度</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="border-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <CardContent className="p-12 text-center relative z-10">
              <h3 className="mb-4 text-3xl font-bold">准备好开始创作了吗？</h3>
              <p className="mb-8 text-lg opacity-90 max-w-2xl mx-auto">
                只需几个简单步骤，就能创造出属于您的专属绘本故事。让想象力插上翅膀，创作无限可能！
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/create">
                  <Button size="lg" variant="secondary" className="px-8 w-full sm:w-auto">
                    立即开始创作
                  </Button>
                </Link>
                <Link href="/history">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 px-8 bg-transparent w-full sm:w-auto"
                  >
                    查看历史作品
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
                <span className="text-lg font-semibold">绘本工坊</span>
              </div>
              <p className="text-gray-600 mb-4">
                让每个故事都有温度，让每个创意都能绽放。我们致力于为用户提供最优质的绘本创作体验。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">产品功能</h4>
              <ul className="space-y-2 text-gray-600">
                <li>AI故事生成</li>
                <li>智能插图创作</li>
                <li>PDF导出</li>
                <li>作品管理</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">帮助支持</h4>
              <ul className="space-y-2 text-gray-600">
                <li>使用教程</li>
                <li>常见问题</li>
                <li>联系客服</li>
                <li>意见反馈</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2024 绘本工坊. 让每个故事都有温度.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
