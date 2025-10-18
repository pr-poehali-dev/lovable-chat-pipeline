import { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileItem[];
  isOpen?: boolean;
}

interface Project {
  id: string;
  name: string;
  lastModified: string;
}

const Editor = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<string>('App.tsx');
  const [code, setCode] = useState(`<div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
  <div className="text-center">
    <h1 className="text-6xl font-bold text-white mb-4">
      Привет, мир! 🚀
    </h1>
    <p className="text-xl text-white/90">
      Начни редактировать код и видь изменения в реальном времени
    </p>
  </div>
</div>`);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Я твой AI-ассистент. Готов помочь с разработкой! 👨‍🚀' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [projectName, setProjectName] = useState('my-project');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const AI_CHAT_URL = 'https://functions.poehali.dev/b7f59477-86f4-4fdc-b075-f609d57e5c73';
  const [fileTree, setFileTree] = useState<FileItem[]>([
    {
      name: 'src',
      type: 'folder',
      isOpen: true,
      children: [
        { name: 'App.tsx', type: 'file' },
        { name: 'index.tsx', type: 'file' },
        { name: 'App.css', type: 'file' },
        {
          name: 'components',
          type: 'folder',
          isOpen: false,
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
      isOpen: false,
      children: [
        { name: 'index.html', type: 'file' }
      ]
    },
    { name: 'package.json', type: 'file' },
    { name: 'tsconfig.json', type: 'file' }
  ]);

  const [projects] = useState<Project[]>([
    { id: '1', name: 'my-project', lastModified: '2 минуты назад' },
    { id: '2', name: 'landing-page', lastModified: '1 час назад' },
    { id: '3', name: 'todo-app', lastModified: 'Вчера' }
  ]);

  const toggleFolder = (items: FileItem[], targetName: string): FileItem[] => {
    return items.map(item => {
      if (item.name === targetName && item.type === 'folder') {
        return { ...item, isOpen: !item.isOpen };
      }
      if (item.children) {
        return { ...item, children: toggleFolder(item.children, targetName) };
      }
      return item;
    });
  };

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map((item, index) => (
      <div key={index}>
        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-2 hover:bg-secondary/50"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              setFileTree(toggleFolder(fileTree, item.name));
            } else {
              setSelectedFile(item.name);
              toast.success(`Открыт файл: ${item.name}`);
            }
          }}
        >
          <Icon 
            name={item.type === 'folder' ? (item.isOpen ? 'FolderOpen' : 'Folder') : 'FileText'} 
            size={16} 
            className="mr-2 text-muted-foreground"
          />
          <span className="text-sm">{item.name}</span>
        </Button>
        {item.children && item.isOpen && renderFileTree(item.children, depth + 1)}
      </div>
    ));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoadingAI) return;
    
    const userMessage = inputMessage;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage('');
    setIsLoadingAI(true);
    
    try {
      const response = await fetch(AI_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }]
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `⚠️ Ошибка: ${data.error}. Проверь настройки API ключа OpenAI.` 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.message 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Не могу подключиться к AI. Проверь интернет и API ключ.' 
      }]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handlePublish = () => {
    setIsPublishing(true);
    toast.loading('Публикуем проект...');
    
    setTimeout(() => {
      setIsPublishing(false);
      toast.success('Проект опубликован! 🚀', {
        description: `https://${projectName}.devstudio.app`
      });
    }, 2000);
  };

  const handleNewFile = () => {
    toast.success('Новый файл создан!');
  };

  const handleSave = () => {
    toast.success('Изменения сохранены!');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Rocket" size={20} className="text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold">{projectName}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Icon name="FolderOpen" size={16} className="mr-2" />
                Проекты
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Мои проекты</DialogTitle>
                <DialogDescription>
                  Выберите проект для открытия или создайте новый
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                {projects.map(project => (
                  <Button
                    key={project.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setProjectName(project.name);
                      toast.success(`Открыт проект: ${project.name}`);
                    }}
                  >
                    <Icon name="Folder" size={16} className="mr-2" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{project.lastModified}</div>
                    </div>
                  </Button>
                ))}
                <Button className="w-full" onClick={() => toast.success('Создан новый проект!')}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Новый проект
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Icon name="Save" size={16} className="mr-2" />
            Сохранить
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Icon name="Settings" size={16} className="mr-2" />
                Настройки
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Настройки проекта</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Название проекта</label>
                  <Input 
                    value={projectName} 
                    onChange={(e) => setProjectName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <Button className="w-full">Сохранить настройки</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            <Icon name="Cloud" size={16} className="mr-2" />
            {isPublishing ? 'Публикуем...' : 'Опубликовать'}
          </Button>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
          <div className="h-full flex flex-col bg-sidebar">
            <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Icon name="FolderTree" size={16} />
                Проводник
              </h2>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewFile}>
                <Icon name="Plus" size={14} />
              </Button>
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
            <div className="border-b border-border px-2 pt-2 flex items-center justify-between">
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
              <div className="flex items-center gap-2 pr-2 pb-2">
                <Button variant="ghost" size="sm" onClick={handleSave}>
                  <Icon name="Save" size={14} className="mr-1" />
                  Ctrl+S
                </Button>
              </div>
            </div>

            <TabsContent value="editor" className="flex-1 m-0 p-0">
              <div className="h-full flex flex-col">
                <div className="h-10 px-4 flex items-center gap-2 border-b border-border bg-muted/30">
                  <Icon name="FileCode" size={14} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedFile}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">UTF-8</span>
                    <span className="text-xs text-muted-foreground">React</span>
                  </div>
                </div>
                <div className="flex-1 code-editor p-4 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/20 flex flex-col text-right pr-2 py-4 text-xs text-muted-foreground font-mono">
                    {code.split('\n').map((_, i) => (
                      <div key={i} className="leading-6">{i + 1}</div>
                    ))}
                  </div>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full resize-none bg-transparent border-0 focus-visible:ring-0 font-mono text-sm pl-14"
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
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: code }} />
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
                  <div key={idx} className="flex gap-3 animate-fade-in">
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
                  onKeyPress={(e) => e.key === 'Enter' && !isLoadingAI && handleSendMessage()}
                  disabled={isLoadingAI}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSendMessage} disabled={isLoadingAI}>
                  {isLoadingAI ? (
                    <Icon name="Loader2" size={16} className="animate-spin" />
                  ) : (
                    <Icon name="Send" size={16} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Editor;