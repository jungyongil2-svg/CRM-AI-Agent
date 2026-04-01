import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function SettingsView() {
  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>설정</CardTitle>
          <CardDescription>데모 화면입니다. 값은 UI 표시용이며 저장되지 않습니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-800">알림</p>
            <label className="flex items-center justify-between gap-3 text-sm text-slate-600">
              승인 요청 알림
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm text-slate-600">
              준법 심사 완료 알림
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" />
            </label>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-800">기본 영업점</p>
            <Input defaultValue="강남중앙지점" />
            <p className="text-xs text-slate-500">로그인 사용자와 매핑되는 값을 가정합니다.</p>
          </div>
          <div className="space-y-3 lg:col-span-2">
            <p className="text-sm font-medium text-slate-800">정책 버전</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">채널정채 v1.4</Badge>
              <Badge variant="outline">타겟모델 v2.1</Badge>
              <Badge variant="outline">RAG 템플릿 2025-Q1</Badge>
            </div>
            <Button variant="secondary" size="sm" type="button">
              변경 이력 보기 (데모)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
