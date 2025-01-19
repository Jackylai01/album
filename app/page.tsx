'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Save,
  Settings2,
  Tag,
  X,
} from 'lucide-react';
import { useState } from 'react';

const AlbumTagManager = () => {
  // 初始相簿數據結構
  const [albums, setAlbums] = useState({
    id: 'root',
    name: '工程專案總管理',
    tags: ['工程', '水電', '建築'],
    expanded: true,
    subAlbums: [
      {
        id: 'sub1',
        name: '2023年度工程',
        tags: ['水電', '施工', '驗收'],
        expanded: true,
        subAlbums: [
          {
            id: 'sub1-1',
            name: '第一季水電工程',
            tags: ['水電', '配管', '初驗'],
            expanded: false,
            subAlbums: [],
          },
          {
            id: 'sub1-2',
            name: '第二季消防工程',
            tags: ['消防', '水電', '複驗'],
            expanded: false,
            subAlbums: [],
          },
        ],
      },
      {
        id: 'sub2',
        name: '2024年度工程',
        tags: ['水電', '維修', '新建'],
        expanded: true,
        subAlbums: [
          {
            id: 'sub2-1',
            name: '台北市案場',
            tags: ['水電', '新建', '招標'],
            expanded: false,
            subAlbums: [],
          },
        ],
      },
    ],
  });

  // State 定義
  const [tagToEdit, setTagToEdit] = useState<string>('');
  const [newTagName, setNewTagName] = useState<string>('');
  const [customizations, setCustomizations] = useState<Record<string, string>>(
    {},
  );
  const [affectedAlbums, setAffectedAlbums] = useState<any[]>([]);

  // 設置客製化標籤名稱
  const setCustomTagName = (albumId: string, customName: any) => {
    setCustomizations((prev: any) => ({
      ...prev,
      [albumId]: customName,
    }));
  };

  // 移除客製化設定
  const removeCustomization = (albumId: string) => {
    const newCustomizations = { ...customizations };
    delete newCustomizations[albumId];
    setCustomizations(newCustomizations);
  };

  // Helper function to get all parent tags for an album
  const getParentTags = (albumId: string, currentAlbum: any): string[] => {
    if (currentAlbum.id === albumId) {
      return [];
    }

    for (const subAlbum of currentAlbum.subAlbums) {
      if (subAlbum.id === albumId) {
        return currentAlbum.tags;
      }
      const parentTags = getParentTags(albumId, subAlbum);
      if (parentTags.length > 0) {
        return [...currentAlbum.tags, ...parentTags];
      }
    }
    return [];
  };

  // Get all tags for an album (including inherited tags)
  const getAllTags = (albumId: string, album: any) => {
    const parentTags = getParentTags(albumId, albums);
    const ownTags = album.tags;
    const combinedTags = [...parentTags, ...ownTags];
    return combinedTags.filter(
      (item, index) => combinedTags.indexOf(item) === index,
    );
  };
  // Modified findAlbumsWithTag to consider inherited tags
  const findAlbumsWithTag = (album: any, tag: string, path: string[] = []) => {
    let results: any[] = [];
    const currentPath = [...path, album.name];
    const allTags = getAllTags(album.id, album);

    if (allTags.includes(tag)) {
      results.push({
        id: album.id,
        path: currentPath.join(' > '),
        name: album.name,
        inherited: !album.tags.includes(tag),
      });
    }

    album.subAlbums.forEach((subAlbum: any) => {
      results = [...results, ...findAlbumsWithTag(subAlbum, tag, currentPath)];
    });

    return results;
  };

  // Modified updateAlbumTags to handle inheritance
  const updateAlbumTags = (
    album: any,
    oldTag: string,
    newTag: string,
    customizations: Record<string, string>,
    applyToSubalbums: boolean = true,
  ) => {
    const newAlbum = { ...album };
    const allTags = getAllTags(album.id, album);

    if (allTags.includes(oldTag)) {
      if (customizations[album.id] && album.tags.includes(oldTag)) {
        // Apply custom tag name if it exists for this album
        newAlbum.tags = album.tags.map((tag: string) =>
          tag === oldTag ? customizations[album.id] : tag,
        );
      } else if (album.tags.includes(oldTag) && newTag) {
        // Apply new tag name if this album contains the old tag
        newAlbum.tags = album.tags.map((tag: string) =>
          tag === oldTag ? newTag : tag,
        );
      }
    }

    if (applyToSubalbums) {
      newAlbum.subAlbums = album.subAlbums.map((subAlbum: any) =>
        updateAlbumTags(subAlbum, oldTag, newTag, customizations, true),
      );
    }

    return newAlbum;
  };

  // Rest of the component remains the same...
  const handleTagEdit = (tag: string) => {
    setTagToEdit(tag);
    setNewTagName(tag);
    const affected = findAlbumsWithTag(albums, tag);
    setAffectedAlbums(affected);
    setCustomizations({});
  };

  const handleTagUpdate = (applyToSubalbums: boolean = true) => {
    if (!newTagName.trim() && Object.keys(customizations).length === 0) return;

    const updatedAlbums = updateAlbumTags(
      albums,
      tagToEdit,
      newTagName,
      customizations,
      applyToSubalbums,
    );
    setAlbums(updatedAlbums);
    setTagToEdit('');
    setNewTagName('');
    setCustomizations({});
    setAffectedAlbums([]);
  };

  // Existing helper functions and rendering logic remain the same...
  const toggleAlbumExpand = (albumId: string) => {
    const updateAlbumExpanded = (album: any) => {
      if (album.id === albumId) {
        return { ...album, expanded: !album.expanded };
      }
      return {
        ...album,
        subAlbums: album.subAlbums.map(updateAlbumExpanded),
      };
    };
    setAlbums(updateAlbumExpanded(albums));
  };
  // 渲染標籤編輯面板
  const renderEditPanel = () => {
    if (!tagToEdit) return null;

    return (
      <Card className='mb-6 border-blue-200'>
        <CardContent className='p-6'>
          <div className='flex items-start gap-6'>
            {/* 左側：主要編輯區 */}
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-6'>
                <Badge
                  variant='default'
                  className='bg-blue-500 text-lg px-3 py-1'
                >
                  <Tag size={16} className='mr-2' />
                  {tagToEdit}
                </Badge>
                <ArrowRight size={20} className='text-gray-400' />
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder='輸入新的標籤名稱'
                  className='max-w-xs text-lg'
                />
              </div>

              <Tabs defaultValue='preview' className='w-full'>
                <TabsList className='mb-4'>
                  <TabsTrigger
                    value='preview'
                    className='flex items-center gap-2'
                  >
                    <AlertCircle size={16} />
                    影響範圍預覽
                  </TabsTrigger>
                  <TabsTrigger
                    value='custom'
                    className='flex items-center gap-2'
                  >
                    <Settings2 size={16} />
                    個別化設定
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='preview'>
                  <ScrollArea className='h-[300px] pr-4'>
                    <div className='space-y-2'>
                      {affectedAlbums.map((album: any) => (
                        <div
                          key={album.id}
                          className='p-3 rounded-lg bg-gray-50 hover:bg-gray-100
                                      transition-colors duration-200'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <FolderTree size={16} className='text-gray-500' />
                              <span className='text-gray-600'>
                                {album.path}
                              </span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Badge variant='outline' className='bg-white'>
                                {customizations[album.id] || newTagName}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value='custom'>
                  <ScrollArea className='h-[300px] pr-4'>
                    <div className='space-y-3'>
                      {affectedAlbums.map((album: any) => (
                        <div
                          key={album.id}
                          className='p-3 rounded-lg bg-gray-50
                                      border border-gray-200 hover:border-blue-200
                                      transition-all duration-200'
                        >
                          <div className='flex items-center justify-between gap-4'>
                            <div className='flex-1'>
                              <div className='text-sm font-medium mb-1'>
                                {album.name}
                              </div>
                              <div className='text-xs text-gray-500'>
                                {album.path}
                              </div>
                            </div>
                            <div className='flex items-center gap-2 min-w-[200px]'>
                              <Input
                                placeholder='自訂標籤名稱'
                                value={customizations[album.id] || ''}
                                onChange={(e) =>
                                  setCustomTagName(album.id, e.target.value)
                                }
                                className='text-sm'
                              />
                              {customizations[album.id] && (
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() => removeCustomization(album.id)}
                                  className='text-gray-400 hover:text-red-400'
                                >
                                  <X size={16} />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* 右側：操作按鈕 */}
            <div className='flex flex-col gap-2 min-w-[120px]'>
              <Button
                onClick={() => handleTagUpdate(true)}
                className='w-full bg-blue-500 hover:bg-blue-600'
              >
                <Save size={16} className='mr-2' />
                儲存
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setTagToEdit('');
                  setCustomizations({});
                }}
                className='w-full'
              >
                <X size={16} className='mr-2' />
                取消
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 渲染相簿卡片

  const renderAlbumCard = (album: any) => {
    const hasCustomization = customizations[album.id];
    const allTags = getAllTags(album.id, album);
    const isAffected = allTags.includes(tagToEdit);

    return (
      <Card
        className={`
        relative border
        ${isAffected ? 'border-blue-200 shadow-sm' : 'border-gray-200'}
        hover:shadow-md transition-all duration-200
      `}
      >
        <CardContent className='p-4'>
          <div className='flex items-center gap-2 mb-3'>
            <Button
              variant='ghost'
              size='sm'
              className='p-1 h-6 w-6 hover:bg-gray-100'
              onClick={() => toggleAlbumExpand(album.id)}
            >
              {album.subAlbums.length > 0 &&
                (album.expanded ? (
                  <ChevronDown size={16} className='text-gray-600' />
                ) : (
                  <ChevronRight size={16} className='text-gray-600' />
                ))}
            </Button>
            <h3 className='font-medium text-gray-700'>{album.name}</h3>
          </div>

          <div className='flex flex-wrap gap-2 ml-7'>
            {allTags
              .sort((a, b) => {
                const aInherited = !album.tags.includes(a);
                const bInherited = !album.tags.includes(b);
                if (aInherited === bInherited) return 0;
                return aInherited ? -1 : 1;
              })
              .map((tag: string) => {
                const isEditing = tag === tagToEdit;
                const customValue = customizations[album.id];
                const displayTag = isEditing && customValue ? customValue : tag;
                const isInherited = !album.tags.includes(tag);

                return (
                  <Badge
                    key={tag}
                    variant={isEditing ? 'default' : 'secondary'}
                    className={`
                    cursor-pointer px-2 py-1
                    ${
                      isEditing
                        ? 'bg-blue-500 text-white'
                        : isInherited
                        ? 'bg-gray-50 text-gray-500 border-dashed'
                        : 'bg-gray-100 text-gray-700'
                    }
                    ${hasCustomization && isEditing ? 'bg-purple-500' : ''}
                    hover:scale-105 transition-all duration-200
                  `}
                    onClick={() => handleTagEdit(tag)}
                  >
                    <Tag size={12} className='mr-1.5 opacity-70' />
                    {displayTag}
                    {isInherited && (
                      <span className='ml-1 text-xs opacity-60'>（繼承）</span>
                    )}
                  </Badge>
                );
              })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // 渲染相簿結構
  const renderAlbum = (album: any, level = 0) => {
    return (
      <div
        key={album.id}
        className={`
             transition-all duration-200 ease-in-out
             ${level > 0 ? 'ml-6 border-l border-gray-100 pl-2' : ''}
           `}
      >
        {renderAlbumCard(album)}
        {album.expanded && (
          <div className='mt-2 space-y-2'>
            {album.subAlbums.map((subAlbum: any) =>
              renderAlbum(subAlbum, level + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen'>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-2xl font-bold flex items-center gap-2 text-gray-800'>
          <Tag size={24} className='text-blue-500' />
          相簿標籤管理系統
        </h2>
      </div>

      {renderEditPanel()}

      <Card className='bg-white'>
        <CardContent className='p-6'>
          <ScrollArea className='h-[600px]'>
            <div className='space-y-2'>{renderAlbum(albums)}</div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlbumTagManager;
