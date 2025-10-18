import { useState, useEffect, useMemo } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileItem[];
}

const LivePreview = ({ code }: { code: string }) => {
  const renderCode = useMemo(() => {
    try {
      return (
        <div dangerouslySetInnerHTML={{ __html: `<div class="preview-container">${code}</div>` }} />
      );
    } catch (error) {
      return (
        <div className="text-red-400 p-4">
          <Icon name="AlertCircle" size={20} className="mb-2" />
          <p>Ошибка в коде</p>
        </div>
      );
    }
  }, [code]);

  return (
    <div className="w-full min-h-full">
      <style>{`
        .preview-container > * {
          all: revert;
        }
      `}</style>
      {renderCode}
    </div>
  );
};

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<string>('App.tsx');
  const [code, setCode] = useState(`<div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
  <div className="text-center">
    <h1 className="text-6xl font-bold text-white mb-4">
      Привет, мир! 🚀
    </h1>
    <p className="text-xl text-white/90">
      Начни редактировать код слева
    </p>
  </div>
</div>`);
  const [livePreview, setLivePreview] = useState(true);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Я твой AI-ассистент. Готов помочь с разработкой! 👨‍🚀' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const fileTree: FileItem[] = [
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'App.tsx', type: 'file' },
        { name: 'index.tsx', type: 'file' },
        { name: 'App.css', type: 'file' },
        {
          name: 'components',
          type: 'folder',
          children: [
            { name: 'Header.tsx', type: 'file' },
            { name: 'Footer.tsx', type: 'file' }
          ]
        }
      ]
    },
    {
      name: 'public',
      type: 'folder',
      children: [
        { name: 'index.html', type: 'file' }
      ]
    },
    { name: 'package.json', type: 'file' },
    { name: 'tsconfig.json', type: 'file' }
  ];

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map((item, index) => (
      <div key={index} style={{ paddingLeft: `${depth * 12}px` }}>
        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-2 hover:bg-secondary/50"
          onClick={() => item.type === 'file' && setSelectedFile(item.name)}
        >
          <Icon 
            name={item.type === 'folder' ? 'Folder' : 'FileText'} 
            size={16} 
            className="mr-2 text-muted-foreground"
          />
          <span className="text-sm">{item.name}</span>
        </Button>
        {item.children && renderFileTree(item.children, depth + 1)}
      </div>
    ));
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    setMessages([...messages, 
      { role: 'user', content: inputMessage },
      { role: 'assistant', content: 'Понял! Работаю над этим...' }
    ]);
    setInputMessage('');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Rocket" size={20} className="text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold">DevStudio</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Icon name="FolderOpen" size={16} className="mr-2" />
            Открыть проект
          </Button>
          <Button variant="ghost" size="sm">
            <Icon name="Settings" size={16} className="mr-2" />
            Настройки
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Icon name="Cloud" size={16} className="mr-2" />
            Опубликовать
          </Button>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
          <div className="h-full flex flex-col bg-sidebar">
            <div className="p-3 border-b border-sidebar-border">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Icon name="FolderTree" size={16} />
                Проводник
              </h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {renderFileTree(fileTree)}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={55} minSize={30}>
          <Tabs defaultValue="editor" className="h-full flex flex-col">
            <div className="border-b border-border px-2 pt-2">
              <TabsList className="h-9">
                <TabsTrigger value="editor" className="text-sm">
                  <Icon name="Code" size={14} className="mr-2" />
                  Редактор
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-sm">
                  <Icon name="Eye" size={14} className="mr-2" />
                  Превью
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="editor" className="flex-1 m-0 p-0">
              <div className="h-full flex flex-col">
                <div className="h-10 px-4 flex items-center gap-2 border-b border-border bg-muted/30">
                  <Icon name="FileCode" size={14} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedFile}</span>
                </div>
                <div className="flex-1 code-editor p-4">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full resize-none bg-transparent border-0 focus-visible:ring-0 font-mono text-sm"
                    placeholder="Начни писать код..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 m-0 p-0">
              <div className="h-full preview-panel flex flex-col">
                <div className="h-10 px-4 flex items-center gap-2 border-b border-border bg-muted/30">
                  <Icon name="Monitor" size={14} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Превью</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Live</span>
                    <div className={`w-2 h-2 rounded-full ${livePreview ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <LivePreview code={code} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full flex flex-col bg-card">
            <div className="p-3 border-b border-border">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Icon name="MessageSquare" size={16} />
                AI Ассистент
              </h2>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                        {msg.role === 'assistant' ? '🤖' : '👤'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Спроси что-нибудь..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Icon name="Send" size={16} />
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;