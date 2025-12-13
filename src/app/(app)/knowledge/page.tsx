'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  mockKnowledgeArticles,
  getPublishedArticles,
  getMostViewedArticles,
  searchArticles,
  getCategoryLabel,
  KnowledgeArticle,
  KBCategory,
} from '@/data/mock-knowledge';
import {
  Search,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  FileText,
  BookOpen,
  Wrench,
  HelpCircle,
  Award,
  Shield,
  Scale,
  Bell,
  Cpu,
  Clock,
  User,
  Tag,
  Paperclip,
  ExternalLink,
  ChevronRight,
  X,
  Filter,
  Upload,
  Link,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const categoryIcons: Record<KBCategory, React.ComponentType<{ className?: string }>> = {
  equipment: Cpu,
  troubleshooting: Wrench,
  sop: FileText,
  faq: HelpCircle,
  best_practices: Award,
  safety: Shield,
  regulatory: Scale,
  technical_bulletin: Bell,
};

const categories: KBCategory[] = [
  'equipment',
  'troubleshooting',
  'sop',
  'faq',
  'best_practices',
  'safety',
  'regulatory',
  'technical_bulletin',
];

export default function KnowledgePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KBCategory | 'all'>('all');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'sop' as KBCategory,
    summary: '',
    content: '',
    tags: '',
    relatedArticles: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const publishedArticles = getPublishedArticles();
  const popularArticles = getMostViewedArticles(5);

  const filteredArticles = searchQuery
    ? searchArticles(searchQuery)
    : selectedCategory === 'all'
    ? publishedArticles
    : publishedArticles.filter((a) => a.category === selectedCategory);

  const handleViewArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setArticleModalOpen(true);
  };

  const handleHelpful = (helpful: boolean) => {
    toast.success(helpful ? 'Thanks for your feedback!' : 'Sorry this wasn\'t helpful', {
      description: helpful
        ? 'We\'re glad this article was useful.'
        : 'We\'ll work on improving this content.',
    });
  };

  const handleCreateArticle = () => {
    if (!newArticle.title || !newArticle.summary || !newArticle.content) {
      toast.error('Missing required fields', {
        description: 'Please fill in Title, Summary, and Content',
      });
      return;
    }
    toast.success('Article created successfully', {
      description: `"${newArticle.title}" has been saved as draft`,
    });
    setCreateModalOpen(false);
    setNewArticle({
      title: '',
      category: 'sop',
      summary: '',
      content: '',
      tags: '',
      relatedArticles: '',
    });
  };

  const getCategoryStats = (category: KBCategory) => {
    return publishedArticles.filter((a) => a.category === category).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100">
        {/* Industrial Header */}
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BookOpen className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Knowledge Base</span>
            <span className="text-[10px] text-slate-400">Technical documentation & guides</span>
          </div>
        </header>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-300 w-96" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-300" />
              ))}
            </div>
            <div className="h-96 bg-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Industrial Header */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BookOpen className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Knowledge Base</span>
          <span className="text-[10px] text-slate-400">Technical documentation & guides</span>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Articles</span>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-blue-600">{publishedArticles.length}</span>
              <span className="text-[10px] text-slate-500">published</span>
            </div>
          </div>
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Views</span>
              <Eye className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-600">
                {publishedArticles.reduce((acc, a) => acc + a.viewCount, 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">all time</span>
            </div>
          </div>
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Helpful Rate</span>
              <ThumbsUp className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-amber-600">94%</span>
              <span className="text-[10px] text-slate-500">positive</span>
            </div>
          </div>
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Categories</span>
              <Tag className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-purple-600">{categories.length}</span>
              <span className="text-[10px] text-slate-500">active</span>
            </div>
          </div>
        </div>

        {/* Search and Category Filter */}
        <div className="border-2 border-slate-300 bg-white p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles, SOPs, troubleshooting guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as KBCategory | 'all')}
                className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors ml-auto"
            >
              <Plus className="h-3 w-3" />
              New Article
            </button>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {categories.map((category) => {
              const Icon = categoryIcons[category];
              const count = getCategoryStats(category);
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  className={`p-3 border-2 transition-colors text-center ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : category)}
                >
                  <div className={`flex h-8 w-8 items-center justify-center mx-auto mb-1 ${
                    isSelected ? 'text-blue-600' : 'text-slate-500'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`text-[9px] font-bold uppercase tracking-wider truncate ${
                    isSelected ? 'text-blue-700' : 'text-slate-600'
                  }`}>
                    {getCategoryLabel(category)}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">{count}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Article List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              {/* Table Header */}
              <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    {selectedCategory === 'all' ? 'All Articles' : getCategoryLabel(selectedCategory)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">({filteredArticles.length})</span>
                </div>
              </div>

              {/* Articles List */}
              <div className="divide-y divide-slate-200">
                {filteredArticles.map((article) => {
                  const Icon = categoryIcons[article.category];

                  return (
                    <div
                      key={article.id}
                      className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handleViewArticle(article)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center bg-slate-100 border border-slate-200 shrink-0">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-800 hover:text-blue-600">{article.title}</h3>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                {article.summary}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Eye className="h-3 w-3" />
                              <span className="font-mono">{article.viewCount.toLocaleString()}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <ThumbsUp className="h-3 w-3" />
                              <span className="font-mono">{article.helpfulCount}</span>
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Clock className="h-3 w-3" />
                              {format(article.lastUpdated, 'MMM d, yyyy')}
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                              {getCategoryLabel(article.category)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredArticles.length === 0 && (
                  <div className="p-8 text-center">
                    <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-sm font-bold text-slate-700 mb-2">No articles found</h3>
                    <p className="text-xs text-slate-500">
                      Try adjusting your search or category filter
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Popular Articles */}
            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Most Viewed</span>
              </div>
              <div className="divide-y divide-slate-200">
                {popularArticles.map((article, index) => (
                  <div
                    key={article.id}
                    className="p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-3"
                    onClick={() => handleViewArticle(article)}
                  >
                    <span className="flex h-6 w-6 items-center justify-center bg-slate-800 text-white text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 line-clamp-2">{article.title}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">
                        {article.viewCount.toLocaleString()} views
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Quick Links</span>
              </div>
              <div className="p-2">
                <button className="w-full p-2 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-slate-700">Safety Guidelines</span>
                </button>
                <button className="w-full p-2 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-slate-700">Compliance Standards</span>
                </button>
                <button className="w-full p-2 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-slate-700">Standard SOPs</span>
                </button>
                <button className="w-full p-2 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors">
                  <Wrench className="h-4 w-4 text-orange-600" />
                  <span className="text-xs font-medium text-slate-700">Troubleshooting Hub</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article View Modal - Industrial Style Wide Rectangle */}
      <Dialog open={articleModalOpen} onOpenChange={setArticleModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] overflow-hidden p-0 gap-0 rounded-none border-2 border-slate-300 flex flex-col">
          <DialogTitle className="sr-only">Article View</DialogTitle>
          {selectedArticle && (
            <div className="flex flex-col h-full">
              {/* Modal Header - Industrial Style */}
              <div className="bg-slate-100 px-6 py-3 flex items-center justify-between flex-shrink-0 border-b-2 border-slate-300">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center bg-white border-2 border-slate-300">
                    <BookOpen className="h-4 w-4 text-slate-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Knowledge Article</span>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-200 border border-slate-300 text-slate-600">
                    {getCategoryLabel(selectedArticle.category)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">v{selectedArticle.version}</span>
                </div>
                <button
                  onClick={() => setArticleModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto flex-1 min-h-0">
                {/* Article Title Section */}
                <div className="px-6 py-4 border-b-2 border-slate-300 bg-slate-100">
                  <h1 className="text-xl font-bold text-slate-800 mb-3">{selectedArticle.title}</h1>
                  <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {selectedArticle.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {format(selectedArticle.lastUpdated, 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="font-mono">{selectedArticle.viewCount.toLocaleString()}</span> views
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-mono text-emerald-600">{selectedArticle.helpfulCount}</span> helpful
                    </span>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                  {/* Tags Row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tags:</span>
                    {selectedArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 border-2 border-slate-200 text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Summary Box */}
                  <div className="border-2 border-slate-300 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Summary</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedArticle.summary}</p>
                  </div>

                  {/* Content Section */}
                  <div className="border-2 border-slate-300 bg-white overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-slate-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Article Content</span>
                    </div>
                    <div className="p-5 text-sm text-slate-700 leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-slate-800 [&_h1]:mb-3 [&_h1]:mt-4 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mb-2 [&_h2]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:mb-2 [&_h3]:mt-2 [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:pl-4 [&_ul]:list-disc [&_ol]:mb-2 [&_ol]:pl-4 [&_ol]:list-decimal [&_li]:mb-1 [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:text-xs [&_pre]:font-mono [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600">
                      <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Attachments Grid */}
                  {selectedArticle.attachments.length > 0 && (
                    <div className="border-2 border-slate-300 bg-white overflow-hidden">
                      <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-slate-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Attachments</span>
                        <span className="text-[10px] font-mono text-slate-500">({selectedArticle.attachments.length})</span>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {selectedArticle.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="p-3 border-2 border-slate-200 bg-slate-50 flex items-center gap-3 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex h-10 w-10 items-center justify-center bg-blue-100 border border-blue-200">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{attachment.name}</p>
                              <p className="text-[10px] font-mono text-slate-500">{attachment.size}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Articles */}
                  {selectedArticle.relatedArticles.length > 0 && (
                    <div className="border-2 border-slate-300 bg-white overflow-hidden">
                      <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                        <Link className="h-4 w-4 text-slate-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Related Articles</span>
                      </div>
                      <div className="divide-y divide-slate-200">
                        {selectedArticle.relatedArticles.map((relatedId) => {
                          const related = mockKnowledgeArticles.find((a) => a.id === relatedId);
                          if (!related) return null;
                          return (
                            <div
                              key={relatedId}
                              className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                              onClick={() => setSelectedArticle(related)}
                            >
                              <BookOpen className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-700 flex-1">{related.title}</span>
                              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                {getCategoryLabel(related.category)}
                              </span>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer - Industrial Style */}
              <div className="bg-slate-100 px-6 py-4 border-t-2 border-slate-300 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Was this helpful?</span>
                  <button
                    onClick={() => handleHelpful(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-slate-300 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Yes ({selectedArticle.helpfulCount})
                  </button>
                  <button
                    onClick={() => handleHelpful(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-slate-300 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-700 transition-colors"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    No ({selectedArticle.notHelpfulCount})
                  </button>
                </div>
                <button
                  onClick={() => setArticleModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Article Modal - Industrial Style Enlarged */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Create New Article</DialogTitle>
          {/* Modal Header */}
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus className="h-4 w-4 text-white" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Create New Article</span>
            </div>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="p-1 hover:bg-slate-700 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Article Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter article title"
                value={newArticle.title}
                onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Category and Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newArticle.category}
                  onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value as KBCategory })}
                  className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Initial Status
                </label>
                <select
                  className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="review">Under Review</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of the article (1-2 sentences)"
                value={newArticle.summary}
                onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 resize-none"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-slate-300 focus-within:border-slate-500">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Markdown Supported</span>
                </div>
                <textarea
                  rows={10}
                  placeholder="Write your article content here... Supports Markdown formatting"
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  className="w-full px-4 py-3 text-sm focus:outline-none resize-none font-mono"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tags
              </label>
              <input
                type="text"
                placeholder="Enter tags separated by commas (e.g., pump, maintenance, safety)"
                value={newArticle.tags}
                onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
                className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Separate multiple tags with commas</p>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Attachments
              </label>
              <div className="border-2 border-dashed border-slate-300 p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Drop files here or click to upload</p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, XLS, Images (Max 10MB each)</p>
              </div>
            </div>

            {/* Related Articles */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Related Articles
              </label>
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search and link related articles..."
                  value={newArticle.relatedArticles}
                  onChange={(e) => setNewArticle({ ...newArticle, relatedArticles: e.target.value })}
                  className="flex-1 px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-100 px-6 py-4 border-t-2 border-slate-300 flex items-center justify-between">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  toast.info('Article saved as draft');
                  setCreateModalOpen(false);
                }}
                className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={handleCreateArticle}
                className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                Create Article
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
