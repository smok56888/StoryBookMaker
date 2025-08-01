"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PreviewViewer } from "@/components/ui/preview-viewer";
import { getStoryDetails } from "@/lib/apiClient";
import { DownloadButton } from "@/components/ui/download-button";
import { toast } from "sonner";

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [storyData, setStoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const story = await getStoryDetails(id);
        setStoryData(story);
      } catch (error) {
        console.error("Error fetching story:", error);
        toast.error("加载故事数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  if (!storyData) {
    return <div className="flex items-center justify-center min-h-screen">未找到绘本</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{storyData.title || "无标题"}</h1>
        <DownloadButton
          storyId={id}
          storyTitle={storyData?.title || "无标题"}
          variant="default"
          size="default"
          showProgress={true}
        />
      </div>
      
      <PreviewViewer 
        title={storyData.title || "无标题"}
        paragraphs={storyData.paragraphs || []}
        images={{
          cover: storyData.images?.cover,
          content: storyData.images?.content || [],
          ending: storyData.images?.ending
        }}
      />
    </div>
  );
}