'use client'

import { TopHeader } from '@/components/top-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <TopHeader title="Analytics" />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Coming next: platform-wide KPIs and store-level drilldowns.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Integrate /analytics endpoints here.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

