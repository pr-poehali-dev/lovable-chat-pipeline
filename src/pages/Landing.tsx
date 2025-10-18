import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: 'Code',
      title: 'Редактор кода',
      description: 'Мощный редактор с подсветкой синтаксиса и автодополнением'
    },
    {
      icon: 'Eye',
      title: 'Живое превью',
      description: 'Видите изменения кода мгновенно в реальном времени'
    },
    {
      icon: 'MessageSquare',
      title: 'AI-ассистент',
      description: 'Умный помощник для написания и отладки кода'
    },
    {
      icon: 'Folder',
      title: 'Управление проектами',
      description: 'Полный контроль над файлами и структурой проекта'
    },
    {
      icon: 'Cloud',
      title: 'Облачный деплой',
      description: 'Публикуйте проекты в интернет одним кликом'
    },
    {
      icon: 'Zap',
      title: 'Быстрая работа',
      description: 'Никаких задержек — всё работает молниеносно'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Rocket" size={20} className="text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">DevStudio</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/editor')}>
              Войти
            </Button>
            <Button onClick={() => navigate('/editor')}>
              Начать разработку
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Icon name="Sparkles" size={16} />
            Платформа для разработки с AI
          </div>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Создавай приложения
            <br />
            быстрее, чем думаешь
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Полноценная среда разработки с редактором кода, живым превью и AI-ассистентом. 
            Всё что нужно для создания проектов — в одном месте.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <Button size="lg" className="text-lg h-12 px-8" onClick={() => navigate('/editor')}>
              <Icon name="Rocket" size={20} className="mr-2" />
              Начать бесплатно
            </Button>
            <Button size="lg" variant="outline" className="text-lg h-12 px-8">
              <Icon name="Play" size={20} className="mr-2" />
              Смотреть демо
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Icon name="Check" size={16} className="text-primary" />
              Без установки
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Check" size={16} className="text-primary" />
              Бесплатно навсегда
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Check" size={16} className="text-primary" />
              AI в комплекте
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Всё что нужно разработчику
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Мощные инструменты для создания современных приложений
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon name={feature.icon as any} size={24} className="text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Готов начать?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Присоединяйся к тысячам разработчиков, которые уже создают проекты в DevStudio
          </p>
          <Button size="lg" className="text-lg h-12 px-8" onClick={() => navigate('/editor')}>
            <Icon name="Rocket" size={20} className="mr-2" />
            Создать первый проект
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 DevStudio. Платформа для разработки с AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
