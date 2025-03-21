"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from "recharts";

export default function SimilarityGraph({ keywords, similarity }) {
  // Sample data if none provided
  const defaultData = [
    { subject: "Keyword1", A: 120, fullMark: 150 },
    { subject: "Keyword2", A: 98, fullMark: 150 },
    { subject: "Keyword3", A: 86, fullMark: 150 },
    { subject: "Keyword4", A: 99, fullMark: 150 },
    { subject: "Keyword5", A: 85, fullMark: 150 },
  ];

  // Transform keywords and similarity into radar chart data if provided
  const data = keywords && similarity ? 
    keywords.map((keyword, index) => ({
      subject: keyword,
      A: similarity[index],
      fullMark: 100,
    })) : 
    defaultData;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Similarity Graph Based on Keywords</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-[16/9] w-full h-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Similarity"
                dataKey="A"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}