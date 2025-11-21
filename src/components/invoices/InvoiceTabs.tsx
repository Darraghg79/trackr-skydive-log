"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InvoiceTabsProps {
  toInvoiceContent: React.ReactNode
  historyContent: React.ReactNode
}

export function InvoiceTabs({ toInvoiceContent, historyContent }: InvoiceTabsProps) {
  return (
    <Tabs defaultValue="to-invoice" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="to-invoice">To Invoice</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="to-invoice" className="mt-6">
        {toInvoiceContent}
      </TabsContent>
      <TabsContent value="history" className="mt-6">
        {historyContent}
      </TabsContent>
    </Tabs>
  )
}
