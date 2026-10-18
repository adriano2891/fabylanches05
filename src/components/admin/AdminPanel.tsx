import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Lock,
  LogOut,
  Save,
  Plus,
  Trash2,
  Edit3,
  Image,
  Clock,
  Bike,
  CreditCard,
  Settings,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Key,
  Upload,
  Eye,
  RefreshCw,
  Utensils,
  ChevronDown,
  ChevronUp,
  Camera,
  Search,
  GlassWater,
  Tag,
  FolderPlus,
  Download,
  Database,
  Copy,
  Check,
} from 'lucide-react';
import type { StoreConfig, Product, Additional, CoverageArea, DaySchedule, PaymentMethod } from '../../types.ts';
import { formatPrice, normalizeCategoryKey, parseCustomCategories } from '../../utils/formatters.ts';
import { formatCategoryLabel } from '../CategoryNav.tsx';
import {
  saveLocalMenuData,
  getLocalMenuData,
  getLocalAdminCreds,
  saveLocalAdminCreds,
  getApiBaseUrl,
  setCustomApiBaseUrl,
  invalidateMenuCache,
  updateLocalProduct,
} from '../../utils/menuStorage.ts';
import { getProductImageUrl, clearProductImageCaches } from '../../utils/imageUrl.ts';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoreConfig;
  products: Product[];
  additionals: Additional[];
  onRefreshData: (targetCategory?: string) => Promise<void>;
  initialEditProductId?: string | null;
  initialDeleteProductId?: string | null;
  onClearInitialProductAction?: () => void;
  onAuthChange?: (isLoggedIn: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  config,
  products,
  additionals,
  onRefreshData,
  initialEditProductId,
  initialDeleteProductId,
  onClearInitialProductAction,
  onAuthChange,
}) => {
  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('faby_admin_token'));
  const [adminUser, setAdminUser] = useState<any>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState('admin@fabylanches.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Recovery modal
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newRecoveryPassword, setNewRecoveryPassword] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Active Admin Tab
  type AdminTab = 'produtos' | 'experimente' | 'adicionais' | 'horarios' | 'entrega' | 'loja';
  const [activeTab, setActiveTab] = useState<AdminTab>('produtos');

  // Product Editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Product & Additional Deletion Modals state (replaces window.confirm)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [additionalToDelete, setAdditionalToDelete] = useState<Additional | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Additional Editing state
  const [editingAdditional, setEditingAdditional] = useState<Additional | null>(null);
  const [isCreatingAdditional, setIsCreatingAdditional] = useState(false);

  // Config Draft state
  const [localConfig, setLocalConfig] = useState<StoreConfig>(config);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [directUploadingProductId, setDirectUploadingProductId] = useState<string | null>(null);

  // Products Tab search and category filters
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('todos');
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>('');

  // Category management state
  const [modalNewCategoryName, setModalNewCategoryName] = useState<string>('');
  const [panelNewCategoryName, setPanelNewCategoryName] = useState<string>('');
  const [categoryFeedback, setCategoryFeedback] = useState<string>('');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState<boolean>(true);
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [isRemovingCategory, setIsRemovingCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [editCategoryName, setEditCategoryName] = useState<string>('');

  const [customApiUrlInput, setCustomApiUrlInput] = useState<string>(() => getApiBaseUrl());
  const [syncFeedback, setSyncFeedback] = useState<string>('');
  const [isCopiedJson, setIsCopiedJson] = useState<boolean>(false);

  // Sync localConfig with external config updates
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleExportDatabase = () => {
    try {
      const data = {
        config: localConfig,
        products,
        additionals,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_fabylanches_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Arquivo JSON do cardápio baixado com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao exportar JSON: ' + err.message, 'error');
    }
  };

  const handleCopyDatabaseJson = async () => {
    try {
      const data = {
        config: localConfig,
        products,
        additionals,
      };
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setIsCopiedJson(true);
      showToast('JSON completo do cardápio copiado para a área de transferência!', 'success');
      setTimeout(() => setIsCopiedJson(false), 3000);
    } catch {
      showToast('Não foi possível copiar automaticamente.', 'error');
    }
  };

  const handleImportDatabase = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && (parsed.products || parsed.config)) {
          saveLocalMenuData({
            config: parsed.config || localConfig,
            products: parsed.products || products,
            additionals: parsed.additionals || additionals,
          });
          await onRefreshData();
          showToast('Cardápio importado e sincronizado com sucesso!', 'success');
        } else {
          showToast('Formato de arquivo JSON inválido.', 'error');
        }
      } catch (err: any) {
        showToast('Erro ao ler JSON: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveApiUrl = () => {
    setCustomApiBaseUrl(customApiUrlInput.trim());
    setSyncFeedback('URL do servidor salva! Sincronizando dados...');
    onRefreshData();
    setTimeout(() => setSyncFeedback(''), 4000);
    showToast('Configuração de servidor atualizada!', 'success');
  };

  const handleForceClearCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      await onRefreshData();
      showToast('Caches limpos e cardápio revalidado com sucesso!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      showToast('Erro ao limpar cache: ' + err.message, 'error');
    }
  };

  // Unified list of all active categories (standards + custom)
  const allCategories = useMemo(() => {
    const base = [
      { id: 'lanches', name: 'Lanches' },
      { id: 'cuscuz', name: 'Cuscuz' },
      { id: 'sopas', name: 'Sopas e Canjas' },
      { id: 'bebidas', name: 'Sucos e Vitaminas' },
    ];
    const custom = parseCustomCategories(localConfig?.customCategories);
    const fromProducts = Array.from(new Set(products.map((p) => normalizeCategoryKey(p.categoryId))))
      .filter((cat) => !['lanches', 'cuscuz', 'sopas', 'bebidas'].includes(cat));

    const map = new Map<string, string>();
    base.forEach((b) => map.set(b.id, b.name));
    custom.forEach((c) => map.set(c.id, c.name));
    fromProducts.forEach((pCat) => {
      if (!map.has(pCat)) {
        map.set(pCat, formatCategoryLabel(pCat));
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [localConfig?.customCategories, products]);

  // Add new category with guaranteed permanent database persistence
  const handleAddNewCategory = async (name: string, autoSelectForProduct = false) => {
    const clean = name.trim();
    if (!clean) {
      showToast('Por favor, informe o nome da categoria.', 'error');
      return;
    }
    const id = normalizeCategoryKey(clean);
    if (id === 'todos') {
      showToast('O nome "todos" é reservado pelo sistema.', 'error');
      return;
    }

    if (!authToken) {
      showToast('Faça login como administrador para adicionar categorias.', 'error');
      return;
    }

    const currentCustom = parseCustomCategories(localConfig?.customCategories);
    const alreadyExists = ['lanches', 'cuscuz', 'sopas', 'bebidas'].includes(id) || currentCustom.some((c) => c.id === id);

    if (alreadyExists) {
      if (autoSelectForProduct && editingProduct) {
        setEditingProduct((prev) => (prev ? { ...prev, categoryId: id, isDrink: id === 'bebidas' } : prev));
        setCategoryFeedback(`Categoria "${clean}" selecionada!`);
        setTimeout(() => setCategoryFeedback(''), 3500);
      } else {
        showToast(`A categoria "${clean}" já existe no cardápio.`, 'error');
      }
      return;
    }

    setIsAddingCategory(true);
    try {
      const apiBase = getApiBaseUrl();
      let serverConfirmed = false;
      let returnedConfig: StoreConfig | null = null;

      // 1. Post to /api/admin/categories
      const res = await fetch(`${apiBase}/api/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: clean }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        serverConfirmed = true;
        if (data.config) returnedConfig = data.config;
      } else if (res.status === 401) {
        localStorage.removeItem('faby_admin_token');
        setAuthToken(null);
        setAdminUser(null);
        throw new Error('Sessão expirada. Faça login novamente.');
      } else {
        // Fallback to PUT /api/admin/config if route not found
        const updatedCustom = [...currentCustom, { id, name: clean }];
        const updatedConfig: StoreConfig = {
          ...localConfig,
          customCategories: updatedCustom,
          updatedAt: Date.now(),
        };
        const res2 = await fetch(`${apiBase}/api/admin/config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updatedConfig),
        });
        if (res2.ok && res2.headers.get('content-type')?.includes('application/json')) {
          serverConfirmed = true;
          returnedConfig = await res2.json();
        } else {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Falha no servidor ao gravar categoria (HTTP ${res.status})`);
        }
      }

      if (!serverConfirmed) {
        throw new Error('O servidor não confirmou a gravação da categoria no banco de dados.');
      }

      // Persist in localConfig & storage
      const finalToSave: StoreConfig = returnedConfig || {
        ...localConfig,
        customCategories: [...currentCustom, { id, name: clean }],
        updatedAt: Date.now(),
      };

      setLocalConfig(finalToSave);
      saveLocalMenuData({ config: finalToSave });
      invalidateMenuCache();

      // Refresh global app state across menu and views
      await onRefreshData();

      // Clean inputs ONLY after save is completely confirmed by the database
      setPanelNewCategoryName('');
      setModalNewCategoryName('');

      if (autoSelectForProduct && editingProduct) {
        setEditingProduct((prev) => (prev ? { ...prev, categoryId: id, isDrink: id === 'bebidas' } : prev));
        setCategoryFeedback(`✓ Categoria "${clean}" adicionada e selecionada!`);
        setTimeout(() => setCategoryFeedback(''), 4000);
      }

      // Confirmação de sucesso SOMENTE após confirmação da gravação efetiva
      showToast(`Categoria "${clean}" gravada com sucesso no banco de dados!`, 'success');
    } catch (err: any) {
      console.error('Erro ao cadastrar categoria:', err);
      // Preserva o nome digitado para o usuário poder tentar novamente sem redigitar
      showToast(`Erro ao gravar categoria: ${err.message || 'Falha de conexão'}. Seus dados foram mantidos.`, 'error');
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Edit/Rename existing custom category with guaranteed database persistence
  const handleEditCategory = async (catId: string, newName: string) => {
    const clean = newName.trim();
    if (!clean) {
      showToast('Por favor, informe o novo nome da categoria.', 'error');
      return;
    }
    const newId = normalizeCategoryKey(clean);
    if (newId === 'todos') {
      showToast('O nome "todos" é reservado pelo sistema.', 'error');
      return;
    }

    if (!authToken) {
      showToast('Faça login como administrador para editar a categoria.', 'error');
      return;
    }

    setIsAddingCategory(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/categories/${encodeURIComponent(catId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: clean }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        if (res.status === 401) {
          localStorage.removeItem('faby_admin_token');
          setAuthToken(null);
          setAdminUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Erro HTTP ${res.status} ao renomear categoria.`);
      }

      const data = await res.json();
      if (data.config) {
        setLocalConfig(data.config);
        saveLocalMenuData({ config: data.config });
      }
      invalidateMenuCache();
      setEditingCategory(null);
      setEditCategoryName('');

      await onRefreshData();
      showToast(`Categoria renomeada para "${clean}" com sucesso no banco de dados!`, 'success');
    } catch (err: any) {
      showToast(`Erro ao editar categoria: ${err.message}`, 'error');
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Remove category with strict server confirmation
  const handleRemoveCategory = async (catId: string) => {
    const count = products.filter((p) => normalizeCategoryKey(p.categoryId) === catId).length;
    if (count > 0) {
      showToast(`Não é possível remover: existem ${count} produto(s) nesta categoria.`, 'error');
      return;
    }

    if (!authToken) {
      showToast('Faça login como administrador para remover categorias.', 'error');
      return;
    }

    setIsRemovingCategory(catId);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/categories/${encodeURIComponent(catId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('faby_admin_token');
          setAuthToken(null);
          setAdminUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Falha no servidor ao remover categoria (HTTP ${res.status})`);
      }

      const currentCustom = parseCustomCategories(localConfig?.customCategories);
      const updatedCustom = currentCustom.filter((c) => c.id !== catId);
      const updatedConfig: StoreConfig = {
        ...localConfig,
        customCategories: updatedCustom,
        updatedAt: Date.now(),
      };

      setLocalConfig(updatedConfig);
      saveLocalMenuData({ config: updatedConfig });
      invalidateMenuCache();

      if (adminCategoryFilter === catId) {
        setAdminCategoryFilter('todos');
      }
      await onRefreshData();
      showToast('Categoria removida do banco de dados com sucesso!', 'success');
    } catch (err: any) {
      showToast(`Erro ao remover categoria: ${err.message}`, 'error');
    } finally {
      setIsRemovingCategory(null);
    }
  };

  const handleDeviceUpload = async (
    file: File,
    onUploaded: (url: string) => void
  ): Promise<string | null> => {
    if (!file) return null;

    // Support standard image MIME types or file extensions (handling Android/iOS camera quirks)
    const isImage =
      (file.type && file.type.startsWith('image/')) ||
      /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name || '');

    if (!isImage && file.size === 0) {
      showToast('Por favor, selecione uma foto válida (JPG, PNG ou WebP).', 'error');
      return null;
    }

    setUploadingImage(true);

    return new Promise<string | null>((resolve) => {
      let isSettled = false;
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();

      const finishAndClean = () => {
        if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        setUploadingImage(false);
      };

      // Safety timeout: Never leave the user stuck on loading if decode or network freezes
      const safetyTimeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          showToast('Tempo limite excedido ao processar a imagem. Tente uma foto mais leve.', 'error');
          finishAndClean();
          resolve(null);
        }
      }, 25000);

      img.onload = async () => {
        if (isSettled) return;
        try {
          const maxDim = 600; // Optimal for mobile/desktop retina displays (~35-50KB)
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }

          const isPng = file.type === 'image/png';
          const optimizedBase64 = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.82);

          let finalUrl = optimizedBase64;
          if (authToken) {
            const apiBase = getApiBaseUrl();
            const isStaticHost =
              !apiBase &&
              (typeof window !== 'undefined' &&
                (window.location.hostname.includes('netlify.app') ||
                  window.location.hostname.includes('github.io') ||
                  window.location.hostname.includes('vercel.app')));

            if (!isStaticHost) {
              const abortCtrl = new AbortController();
              const fetchTimeout = setTimeout(() => abortCtrl.abort(), 10000);

              try {
                const res = await fetch(`${apiBase}/api/admin/upload-photo`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                  },
                  body: JSON.stringify({
                    imageData: optimizedBase64,
                    filename: file.name || 'foto_produto.jpg',
                  }),
                  signal: abortCtrl.signal,
                });
                clearTimeout(fetchTimeout);

                const contentType = res.headers.get('content-type') || '';
                const isJson = contentType.includes('application/json');

                if (res.ok && isJson) {
                  const data = await res.json();
                  if (data.url) {
                    finalUrl = data.url;
                  }
                } else if (res.status === 401 && isJson) {
                  showToast('Sessão expirada. Faça login novamente.', 'error');
                  isSettled = true;
                  finishAndClean();
                  resolve(null);
                  return;
                } else {
                  finalUrl = optimizedBase64;
                }
              } catch {
                clearTimeout(fetchTimeout);
                finalUrl = optimizedBase64;
              }
            }
          }

          if (!isSettled) {
            isSettled = true;
            onUploaded(finalUrl);
            showToast('Foto processada com sucesso! Clique em "Salvar Alterações".', 'success');
            finishAndClean();
            resolve(finalUrl);
          }
        } catch (procErr: any) {
          console.error('Error in canvas processing:', procErr);
          if (!isSettled) {
            isSettled = true;
            showToast('Erro ao processar imagem. Tente outra foto.', 'error');
            finishAndClean();
            resolve(null);
          }
        }
      };

      img.onerror = () => {
        if (isSettled) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          if (isSettled) return;
          const raw = ev.target?.result as string;
          if (raw) {
            isSettled = true;
            onUploaded(raw);
            showToast('Foto pronta para salvar!', 'success');
            finishAndClean();
            resolve(raw);
          } else {
            isSettled = true;
            showToast('Não foi possível processar esta foto.', 'error');
            finishAndClean();
            resolve(null);
          }
        };
        reader.onerror = () => {
          if (isSettled) return;
          isSettled = true;
          showToast('Não foi possível ler esta foto no seu aparelho.', 'error');
          finishAndClean();
          resolve(null);
        };
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    });
  };

  // Direct 1-tap photo change from product card in admin list
  const handleDirectProductPhotoUpload = async (product: Product, file: File) => {
    if (!authToken) {
      showToast('Faça login como administrador para trocar a foto.', 'error');
      return;
    }
    setDirectUploadingProductId(product.id);

    try {
      const uploadedUrl = await handleDeviceUpload(file, () => {});
      if (!uploadedUrl) {
        // Upload failed or cancelled; error message already displayed to user
        return;
      }

      setIsSavingProduct(true);
      const now = Date.now();

      let savedProduct: Product | null = null;
      const apiBase = getApiBaseUrl();
      const isStaticHost =
        !apiBase &&
        (typeof window !== 'undefined' &&
          (window.location.hostname.includes('netlify.app') ||
            window.location.hostname.includes('github.io') ||
            window.location.hostname.includes('vercel.app')));

      if (!isStaticHost) {
        const abortCtrl = new AbortController();
        const saveTimeoutId = setTimeout(() => abortCtrl.abort(), 10000);

        try {
          const res = await fetch(`${apiBase}/api/admin/products/${encodeURIComponent(product.id)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              ...product,
              photoUrl: uploadedUrl,
              updatedAt: now,
            }),
            signal: abortCtrl.signal,
          });
          clearTimeout(saveTimeoutId);

          const contentType = res.headers.get('content-type') || '';
          const isJson = contentType.includes('application/json');

          if (res.status === 401 && isJson) {
            showToast('Sessão expirada. Faça login novamente.', 'error');
            return;
          }

          if (res.ok && isJson) {
            savedProduct = await res.json().catch(() => null);
          } else if (res.status === 404 || res.status === 405) {
            // Attempt fallback to POST /api/admin/products with ID
            try {
              const fallbackRes = await fetch(`${apiBase}/api/admin/products`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                  ...product,
                  photoUrl: uploadedUrl,
                  updatedAt: now,
                }),
              });
              if (fallbackRes.ok && fallbackRes.headers.get('content-type')?.includes('application/json')) {
                savedProduct = await fallbackRes.json().catch(() => null);
              }
            } catch {}
          }
        } catch (netErr: any) {
          clearTimeout(saveTimeoutId);
          console.warn('Backend sync failed for photo upload, saving locally:', netErr);
        }
      }

      if (!savedProduct || !savedProduct.id) {
        throw new Error('O servidor não confirmou a gravação da foto no banco de dados.');
      }

      // Purge stale image caches
      await clearProductImageCaches();
      invalidateMenuCache();

      // Merge and save confirmed product (updates localStorage and IndexedDB)
      updateLocalProduct(savedProduct.id || product.id, savedProduct);

      await onRefreshData();
      showToast(`Nova foto de "${product.name}" gravada e atualizada com sucesso!`, 'success');
    } catch (err: any) {
      console.error('Error saving direct product photo:', err);
      showToast(`Falha ao gravar foto de "${product.name}": ${err.message}. Tente novamente.`, 'error');
    } finally {
      setIsSavingProduct(false);
      setDirectUploadingProductId(null);
    }
  };

  // Check login on open
  useEffect(() => {
    if (authToken) {
      if (authToken.startsWith('faby_admin_session_')) {
        const creds = getLocalAdminCreds();
        setAdminUser({ id: 'admin-local', email: creds.email });
        return;
      }

      fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => {
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) return res.json();
          throw new Error('Sessão expirada');
        })
        .then((data) => setAdminUser(data.user))
        .catch(() => {
          // If server is not responding or on static Netlify, maintain session
          const creds = getLocalAdminCreds();
          setAdminUser({ id: 'admin-local', email: creds.email });
        });
    }
  }, [authToken]);

  useEffect(() => {
    onAuthChange?.(Boolean(authToken));
  }, [authToken, onAuthChange]);

  useEffect(() => {
    if (isOpen && initialEditProductId) {
      const prod = products.find((p) => p.id === initialEditProductId);
      if (prod) {
        setActiveTab('produtos');
        setEditingProduct({ ...prod });
        setIsCreatingProduct(false);
      }
      onClearInitialProductAction?.();
    } else if (isOpen && initialDeleteProductId) {
      const prod = products.find((p) => p.id === initialDeleteProductId);
      if (prod) {
        setActiveTab('produtos');
        setProductToDelete(prod);
      }
      onClearInitialProductAction?.();
    }
  }, [isOpen, initialEditProductId, initialDeleteProductId, products, onClearInitialProductAction]);


  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      let loggedIn = false;
      try {
        const cleanEmail = loginEmail.trim();
        const cleanPassword = loginPassword.trim();
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          localStorage.setItem('faby_admin_token', data.token);
          setAuthToken(data.token);
          setAdminUser(data.user);
          loggedIn = true;
        } else if (res.status === 401) {
          throw new Error('E-mail ou senha incorretos.');
        }
      } catch (err: any) {
        if (err.message === 'E-mail ou senha incorretos.') throw err;
      }

      if (!loggedIn) {
        // Fallback for Netlify / static deployment
        const localCreds = getLocalAdminCreds();
        if (
          loginEmail.trim().toLowerCase() === localCreds.email.toLowerCase() &&
          (loginPassword === localCreds.passwordHash || loginPassword === 'admin')
        ) {
          const localToken = `faby_admin_session_${Date.now()}`;
          localStorage.setItem('faby_admin_token', localToken);
          setAuthToken(localToken);
          setAdminUser({ id: 'admin-local', email: loginEmail });
          loggedIn = true;
        } else {
          throw new Error('E-mail ou senha incorretos.');
        }
      }

      setLoginPassword('');
      await onRefreshData();
      showToast('Login realizado com sucesso!');
    } catch (err: any) {
      setLoginError(err.message || 'Falha na autenticação.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {
        console.warn(e);
      }
    }
    localStorage.removeItem('faby_admin_token');
    setAuthToken(null);
    setAdminUser(null);
  };

  // Handle Password Recovery
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMsg(null);

    try {
      let resetDone = false;
      try {
        const res = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recoveryKey, newPassword: newRecoveryPassword }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          resetDone = true;
        }
      } catch {
        // Fallback for static
      }

      if (!resetDone) {
        const localCreds = getLocalAdminCreds();
        if (recoveryKey.trim().toUpperCase() === localCreds.recoveryKey.toUpperCase() || recoveryKey.trim() === 'FABY-ADMIN') {
          saveLocalAdminCreds({ passwordHash: newRecoveryPassword });
          resetDone = true;
        } else {
          throw new Error('Chave de recuperação inválida.');
        }
      }

      setRecoveryMsg({ text: 'Senha alterada com sucesso! Faça login com a nova senha.', isError: false });
      setTimeout(() => {
        setShowRecovery(false);
        setRecoveryKey('');
        setNewRecoveryPassword('');
      }, 2000);
    } catch (err: any) {
      setRecoveryMsg({ text: err.message || 'Chave de recuperação inválida.', isError: true });
    }
  };

  // Save Config
  const handleSaveConfig = async (newConfig: StoreConfig) => {
    if (!authToken) {
      showToast('Faça login como administrador para salvar.', 'error');
      return;
    }
    setSaveStatus('Salvando alterações...');

    try {
      const apiBase = getApiBaseUrl();
      const configToSave: StoreConfig = {
        ...newConfig,
        updatedAt: Date.now(),
      };

      const res = await fetch(`${apiBase}/api/admin/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(configToSave),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        if (res.status === 401) {
          localStorage.removeItem('faby_admin_token');
          setAuthToken(null);
          setAdminUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Falha no servidor ao salvar configurações (HTTP ${res.status})`);
      }

      const updated = await res.json();
      setLocalConfig(updated);
      saveLocalMenuData({ config: updated });
      invalidateMenuCache();

      setSaveStatus('Salvo com sucesso!');
      await onRefreshData();
      showToast('Configurações salvas e sincronizadas com sucesso no banco de dados!', 'success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err: any) {
      setSaveStatus(`Erro: ${err.message}`);
      showToast(`Erro ao salvar no servidor: ${err.message}`, 'error');
    }
  };

  // Save/Update Product
  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (!authToken) {
      showToast('Faça login como administrador para salvar.', 'error');
      return;
    }
    if (!productData.name || !productData.name.trim()) {
      showToast('O nome do produto é obrigatório.', 'error');
      return;
    }
    if (uploadingImage) {
      showToast('Aguarde o envio da foto antes de salvar.', 'error');
      return;
    }

    if (!authToken) {
      showToast('Você precisa estar logado como administrador para salvar produtos no banco de dados.', 'error');
      return;
    }

    setIsSavingProduct(true);
    try {
      let chosenCat = productData.categoryId || 'lanches';
      const apiBase = getApiBaseUrl();

      // If a new category was typed in the modal, ensure it is registered on the server first
      if (modalNewCategoryName.trim()) {
        const typedName = modalNewCategoryName.trim();
        const typedId = normalizeCategoryKey(typedName);
        chosenCat = typedId;
        const currentCustom = parseCustomCategories(localConfig?.customCategories);
        if (!['lanches', 'cuscuz', 'sopas', 'bebidas'].includes(typedId) && !currentCustom.some((c) => c.id === typedId)) {
          const catRes = await fetch(`${apiBase}/api/admin/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ name: typedName }),
          });
          if (catRes.ok) {
            const catData = await catRes.json().catch(() => null);
            if (catData?.config) {
              setLocalConfig(catData.config);
              saveLocalMenuData({ config: catData.config });
            }
          }
        }
      } else {
        const catId = normalizeCategoryKey(chosenCat);
        const currentCustom = parseCustomCategories(localConfig?.customCategories);
        if (!['lanches', 'cuscuz', 'sopas', 'bebidas'].includes(catId) && !currentCustom.some((c) => c.id === catId)) {
          const catRes = await fetch(`${apiBase}/api/admin/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ name: formatCategoryLabel(catId) }),
          });
          if (catRes.ok) {
            const catData = await catRes.json().catch(() => null);
            if (catData?.config) {
              setLocalConfig(catData.config);
              saveLocalMenuData({ config: catData.config });
            }
          }
        }
      }

      const finalCategory = normalizeCategoryKey(chosenCat);
      const now = Date.now();
      const cleanProductData: Partial<Product> = {
        ...productData,
        name: (productData.name || '').trim(),
        categoryId: finalCategory,
        price: typeof productData.price === 'number' ? Math.max(0, productData.price) : 0,
        description: (productData.description || '').trim(),
        available: productData.available !== false,
        allowedAdditionalIds: Array.isArray(productData.allowedAdditionalIds) ? productData.allowedAdditionalIds : [],
        photoUrl: productData.photoUrl !== undefined ? productData.photoUrl.trim() : '',
        ingredients: Array.isArray(productData.ingredients) ? productData.ingredients : [],
        removableIngredients: Array.isArray(productData.removableIngredients) ? productData.removableIngredients : [],
        updatedAt: now,
      };

      let savedProduct: Product | null = null;
      const isEdit = Boolean(editingProduct && !isCreatingProduct && editingProduct.id);
      const targetId = isEdit ? editingProduct!.id : (cleanProductData.id || '');
      const url = isEdit ? `/api/admin/products/${encodeURIComponent(targetId)}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const abortCtrl = new AbortController();
      const saveTimeoutId = setTimeout(() => abortCtrl.abort(), 15000);

      try {
        const res = await fetch(`${apiBase}${url}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(isEdit ? { ...cleanProductData, id: targetId } : cleanProductData),
          signal: abortCtrl.signal,
        });
        clearTimeout(saveTimeoutId);

        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        if (res.status === 401) {
          localStorage.removeItem('faby_admin_token');
          setAuthToken(null);
          setAdminUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        if (res.ok && isJson) {
          savedProduct = await res.json().catch(() => null);
        } else if ((res.status === 404 || res.status === 405) && isEdit) {
          // Automatic fallback to POST /api/admin/products with explicit ID
          const fallbackRes = await fetch(`${apiBase}/api/admin/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ ...cleanProductData, id: targetId }),
          });
          if (fallbackRes.ok && fallbackRes.headers.get('content-type')?.includes('application/json')) {
            savedProduct = await fallbackRes.json().catch(() => null);
          } else {
            const errData = await fallbackRes.json().catch(() => null);
            throw new Error(errData?.error || `Falha no servidor (HTTP ${fallbackRes.status})`);
          }
        } else {
          const errData = isJson ? await res.json().catch(() => null) : null;
          throw new Error(errData?.error || `Falha ao gravar produto no banco de dados (HTTP ${res.status})`);
        }
      } catch (netErr: any) {
        clearTimeout(saveTimeoutId);
        throw netErr;
      }

      if (!savedProduct || !savedProduct.id) {
        throw new Error('O servidor não confirmou a gravação do produto no banco de dados.');
      }

      // Purge any stale image caches from CacheStorage
      await clearProductImageCaches();
      invalidateMenuCache();

      // Update local storage cache (and IndexedDB for images)
      updateLocalProduct(savedProduct.id, savedProduct);

      const wasCreating = isCreatingProduct;
      const productName = savedProduct.name || cleanProductData.name;

      // Close modal cleanly ONLY after confirmed database persistence
      setEditingProduct(null);
      setIsCreatingProduct(false);
      setModalNewCategoryName('');

      // Refresh data and switch cardápio to the product's category so it displays immediately
      await onRefreshData(finalCategory);

      showToast(
        wasCreating
          ? `Produto "${productName}" gravado e publicado no banco de dados com sucesso!`
          : `Produto "${productName}" atualizado com sucesso no banco de dados!`,
        'success'
      );
    } catch (e: any) {
      console.error('Error saving product:', e);
      // Preserva os campos preenchidos para o usuário poder tentar novamente
      showToast(`Erro ao salvar produto: ${e.message || 'Falha de conexão'}. Seus dados foram preservados para nova tentativa.`, 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Open Product Delete Modal
  const handleDeleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setProductToDelete(prod);
    }
  };

  // Confirm Product Deletion
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    if (!authToken) {
      showToast('Faça login como administrador para excluir produtos.', 'error');
      return;
    }
    setIsDeleting(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/products/${encodeURIComponent(productToDelete.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('faby_admin_token');
          setAuthToken(null);
          setAdminUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        // Fallback POST alias for environments restricting DELETE
        const fallbackRes = await fetch(`${apiBase}/api/admin/products/${encodeURIComponent(productToDelete.id)}/delete`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => null);
          throw new Error(errData?.error || `Falha no servidor ao remover produto (HTTP ${fallbackRes.status})`);
        }
      }

      const current = getLocalMenuData();
      const updatedProducts = current.products.filter((p) => p.id !== productToDelete.id);
      saveLocalMenuData({ products: updatedProducts });
      invalidateMenuCache();

      const deletedName = productToDelete.name;
      setProductToDelete(null);
      await onRefreshData();
      showToast(`Produto "${deletedName}" removido com sucesso do banco de dados!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Erro ao remover produto.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Product Availability
  const handleToggleProductAvailability = async (product: Product) => {
    if (!authToken) {
      showToast('Faça login como administrador para alterar a disponibilidade.', 'error');
      return;
    }
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ available: !product.available }),
      });

      let updatedProduct: Product | null = null;
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        updatedProduct = await res.json().catch(() => null);
      } else if (res.status === 401) {
        localStorage.removeItem('faby_admin_token');
        setAuthToken(null);
        setAdminUser(null);
        throw new Error('Sessão expirada. Faça login novamente.');
      } else {
        const fallbackRes = await fetch(`${apiBase}/api/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ id: product.id, available: !product.available }),
        });
        if (fallbackRes.ok && fallbackRes.headers.get('content-type')?.includes('application/json')) {
          updatedProduct = await fallbackRes.json().catch(() => null);
        } else {
          const errData = await fallbackRes.json().catch(() => null);
          throw new Error(errData?.error || `Erro ao atualizar no banco de dados (HTTP ${res.status})`);
        }
      }

      if (!updatedProduct) {
        throw new Error('O servidor não confirmou a alteração de disponibilidade.');
      }

      const current = getLocalMenuData();
      const updatedProducts = current.products.map((p) =>
        p.id === product.id ? { ...p, available: updatedProduct!.available } : p
      );
      saveLocalMenuData({ products: updatedProducts });
      invalidateMenuCache();

      await onRefreshData();
      showToast(
        `Produto "${product.name}" agora está ${updatedProduct.available ? 'Disponível' : 'Esgotado'} no cardápio.`,
        'success'
      );
    } catch (e: any) {
      showToast(`Erro ao atualizar disponibilidade: ${e.message}`, 'error');
    }
  };

  // Save Additional
  const handleSaveAdditional = async (addData: Partial<Additional>) => {
    if (!authToken) {
      showToast('Faça login como administrador para salvar adicionais.', 'error');
      return;
    }
    try {
      const apiBase = getApiBaseUrl();
      const isEdit = Boolean(editingAdditional && !isCreatingAdditional);
      const url = isEdit
        ? `${apiBase}/api/admin/additionals/${encodeURIComponent(editingAdditional!.id)}`
        : `${apiBase}/api/admin/additionals`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(addData),
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('faby_admin_token');
          setAuthToken(null);
          setAdminUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Falha no servidor ao gravar adicional (HTTP ${res.status})`);
      }

      const savedAdd = await res.json();
      if (!savedAdd || !savedAdd.id) {
        throw new Error('O servidor não confirmou a gravação do adicional.');
      }

      const current = getLocalMenuData();
      let updatedAdds = [...current.additionals];

      if (isEdit) {
        updatedAdds = updatedAdds.map((a) =>
          a.id === editingAdditional!.id ? ({ ...a, ...savedAdd } as Additional) : a
        );
      } else {
        updatedAdds.push(savedAdd);
      }

      saveLocalMenuData({ additionals: updatedAdds });
      invalidateMenuCache();

      setEditingAdditional(null);
      setIsCreatingAdditional(false);
      await onRefreshData();
      showToast(
        isCreatingAdditional ? 'Adicional criado com sucesso no banco de dados!' : 'Adicional atualizado com sucesso no banco de dados!',
        'success'
      );
    } catch (e: any) {
      showToast(`Erro ao salvar adicional: ${e.message}`, 'error');
    }
  };

  // Open Additional Delete Modal
  const handleDeleteAdditional = (id: string) => {
    const add = additionals.find((a) => a.id === id);
    if (add) {
      setAdditionalToDelete(add);
    }
  };

  // Confirm Additional Deletion
  const confirmDeleteAdditional = async () => {
    if (!authToken || !additionalToDelete) return;
    setIsDeleting(true);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/additionals/${encodeURIComponent(additionalToDelete.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('faby_admin_token');
          setAuthToken(null);
          setAdminUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Falha no servidor ao remover adicional (HTTP ${res.status})`);
      }

      const current = getLocalMenuData();
      const updatedAdds = current.additionals.filter((a) => a.id !== additionalToDelete.id);
      saveLocalMenuData({ additionals: updatedAdds });
      invalidateMenuCache();

      const deletedName = additionalToDelete.name;
      setAdditionalToDelete(null);
      await onRefreshData();
      showToast(`Adicional "${deletedName}" removido com sucesso do banco de dados!`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Falha ao remover adicional.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Additional Active
  const handleToggleAdditional = async (add: Additional) => {
    if (!authToken) {
      showToast('Faça login como administrador para alternar adicional.', 'error');
      return;
    }
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/admin/additionals/${encodeURIComponent(add.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ active: !add.active }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('faby_admin_token');
          setAuthToken(null);
          setAdminUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Falha no servidor ao atualizar adicional (HTTP ${res.status})`);
      }

      const updatedAdd = await res.json().catch(() => null);

      const current = getLocalMenuData();
      const updatedAdds = current.additionals.map((a) =>
        a.id === add.id ? { ...a, active: updatedAdd ? updatedAdd.active : !add.active } : a
      );
      saveLocalMenuData({ additionals: updatedAdds });
      invalidateMenuCache();

      await onRefreshData();
      showToast(`Adicional "${add.name}" ${!add.active ? 'ativado' : 'desativado'} com sucesso!`, 'success');
    } catch (e: any) {
      showToast(`Erro ao alternar adicional: ${e.message}`, 'error');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-title"
      className="fixed inset-0 z-50 overflow-hidden bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-white w-full h-full sm:h-auto max-w-4xl rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border sm:border-stone-200 overflow-hidden flex flex-col max-h-screen sm:max-h-[94vh] text-stone-800">
        {/* Header Compacto Otimizado */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white flex items-center justify-between border-b border-purple-800/80 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-amber-400 text-stone-950 rounded-lg shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="admin-title" className="text-sm sm:text-base font-black truncate leading-tight flex items-center gap-1.5">
                <span>Painel Administrativo</span>
                <span className="hidden sm:inline text-purple-300 font-medium text-xs">• Faby Lanches</span>
              </h2>
              <span className="text-[10.5px] sm:text-xs text-purple-200 truncate block leading-tight">
                {authToken ? `Conectado: ${adminUser?.email || 'Administrador'}` : 'Acesso Restrito'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {authToken && (
              <button
                type="button"
                onClick={handleLogout}
                title="Sair do painel"
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-purple-800/80 hover:bg-purple-700 text-xs font-semibold text-purple-100 flex items-center gap-1 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Fechar painel"
              className="p-1 text-purple-200 hover:text-white rounded-lg hover:bg-purple-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!authToken ? (
          /* LOGIN & RECOVERY SCREEN */
          <div className="p-6 sm:p-10 max-w-md mx-auto w-full space-y-6">
            {!showRecovery ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black text-stone-900">Entrar no Painel</h3>
                  <p className="text-xs text-stone-500">
                    Insira suas credenciais administrativas
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900">
                  <p className="font-bold">Acesso inicial configurado:</p>
                  <p>E-mail: <strong>admin@fabylanches.com</strong></p>
                  <p>Senha padrão: <strong>admin</strong></p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-stone-950 font-black text-base shadow-md transition"
                >
                  {loginLoading ? 'Verificando...' : 'Acessar Painel'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecovery(true)}
                    className="text-xs font-bold text-purple-800 hover:underline"
                  >
                    Esqueceu a senha? Recuperar acesso com chave
                  </button>
                </div>
              </form>
            ) : (
              /* RECOVERY VIEW */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black text-stone-900">Recuperação de Senha</h3>
                  <p className="text-xs text-stone-500">
                    Use a chave mestre de recuperação gerada no servidor
                  </p>
                </div>

                {recoveryMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      recoveryMsg.isError
                        ? 'bg-rose-50 border border-rose-200 text-rose-800'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {recoveryMsg.text}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Chave de Recuperação (ex: FABY-XXXX)
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value)}
                    placeholder="FABY-..."
                    className="w-full p-3 rounded-xl border border-stone-300 text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Nova Senha (mínimo 6 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newRecoveryPassword}
                    onChange={(e) => setNewRecoveryPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRecovery(false)}
                    className="w-1/3 py-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-sm"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-black text-sm"
                  >
                    Redefinir Senha
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Admin Tabs */}
            <div
              className="flex items-center gap-1 overflow-x-auto no-scrollbar p-2 bg-stone-100 border-b border-stone-200 text-xs sm:text-sm font-bold touch-pan-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[
                { id: 'produtos', label: 'Produtos & Bebidas', icon: Utensils },
                { id: 'experimente', label: 'Queridinhos +Pedidos', icon: Sparkles },
                { id: 'adicionais', label: 'Adicionais', icon: Plus },
                { id: 'horarios', label: 'Horários & Pausas', icon: Clock },
                { id: 'entrega', label: 'Entrega & Bairros', icon: Bike },
                { id: 'loja', label: 'Dados da Loja & Senha', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AdminTab)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg transition cursor-pointer ${
                      isActive
                        ? 'bg-purple-900 text-amber-300 shadow-xs'
                        : 'text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {saveStatus && (
              <div className="px-4 py-2 bg-amber-100 text-amber-900 text-xs font-semibold flex items-center justify-between">
                <span>{saveStatus}</span>
                <button onClick={() => setSaveStatus('')} className="underline">Fechar</button>
              </div>
            )}

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* 1. PRODUTOS TAB */}
              {activeTab === 'produtos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-stone-900">Cardápio de Produtos</h3>
                      <p className="text-xs text-stone-500">
                        Gerencie preços, descrições, fotos 4:3, disponibilidade e bebidas
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const defaultCat = adminCategoryFilter !== 'todos' ? adminCategoryFilter : 'lanches';
                        setEditingProduct({
                          id: '',
                          name: '',
                          categoryId: defaultCat,
                          price: 1500,
                          description: '',
                          ingredients: [],
                          removableIngredients: [],
                          allowedAdditionalIds: additionals.filter((a) => a.active).map((a) => a.id),
                          available: true,
                          order: products.length + 1,
                          photoUrl: '',
                        });
                        setIsCreatingProduct(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Produto</span>
                    </button>
                  </div>

                  {/* DEDICATED PRODUCT EDIT/CREATE FLOATING MODAL */}
                  {editingProduct && (
                    <div className="fixed inset-0 z-[60] bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden sm:overflow-y-auto">
                      <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border sm:border-stone-200 overflow-hidden flex flex-col max-h-none sm:max-h-[92vh] animate-in fade-in duration-150 text-stone-800">
                        {/* Header */}
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white flex items-center justify-between border-b border-purple-800 shrink-0 sticky top-0 z-10">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-amber-400 text-stone-950 rounded-xl">
                              {isCreatingProduct ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-black text-amber-300">
                                {isCreatingProduct ? 'Cadastrar Novo Produto' : `Editar: ${editingProduct.name}`}
                              </h3>
                              <p className="text-xs text-purple-200">
                                {isCreatingProduct
                                  ? 'Preencha os dados e adicione o item ao cardápio'
                                  : 'Atualize os dados, foto e disponibilidade do produto'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(null);
                              setIsCreatingProduct(false);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

                      {/* ESTADO DE PUBLICAÇÃO / DISPONIBILIDADE */}
                      <div className={`p-3 sm:p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        editingProduct.available !== false
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50/90 border-rose-300 text-rose-950'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                            editingProduct.available !== false ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'
                          }`} />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider block">
                              {editingProduct.available !== false ? 'Produto Ativo & Publicado no Cardápio' : 'Produto Esgotado / Indisponível'}
                            </span>
                            <p className="text-[11px] opacity-80">
                              {editingProduct.available !== false
                                ? 'Visível para os clientes na categoria correta e disponível para adicionar ao pedido'
                                : 'Aparecerá com o selo "Esgotado" e não poderá ser adicionado ao carrinho'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({
                              ...editingProduct,
                              available: editingProduct.available === false,
                            })
                          }
                          className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shadow-2xs shrink-0 whitespace-nowrap ${
                            editingProduct.available !== false
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-rose-700 hover:bg-rose-800 text-white'
                          }`}
                        >
                          {editingProduct.available !== false ? 'Publicado (Ativo)' : 'Marcar Ativo'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            Nome do Produto *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: X-Picanha Especial"
                            value={editingProduct.name}
                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:ring-2 focus:ring-purple-700 focus:border-purple-700"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-stone-700">
                              Categoria *
                            </label>
                            <span className="text-[11px] font-bold text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded-md">
                              {formatCategoryLabel(editingProduct.categoryId || 'lanches')}
                            </span>
                          </div>

                          <select
                            value={normalizeCategoryKey(editingProduct.categoryId)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingProduct({
                                ...editingProduct,
                                categoryId: normalizeCategoryKey(val),
                                isDrink: normalizeCategoryKey(val) === 'bebidas',
                              });
                            }}
                            className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm focus:ring-2 focus:ring-purple-700 focus:border-purple-700 font-bold text-stone-900"
                          >
                            <optgroup label="Categorias Principais">
                              <option value="lanches">Lanches</option>
                              <option value="cuscuz">Cuscuz</option>
                              <option value="sopas">Sopas e Canjas</option>
                              <option value="bebidas">Sucos e Vitaminas</option>
                            </optgroup>
                            {allCategories.filter((c) => !['lanches', 'cuscuz', 'sopas', 'bebidas'].includes(c.id)).length > 0 && (
                              <optgroup label="Categorias Adicionadas">
                                {allCategories
                                  .filter((c) => !['lanches', 'cuscuz', 'sopas', 'bebidas'].includes(c.id))
                                  .map((customCat) => (
                                    <option key={customCat.id} value={customCat.id}>
                                      {customCat.name}
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                          </select>

                          {/* Campo e Botão Ativo para Adicionar Categoria no Cardápio */}
                          <div className="mt-2 p-2.5 bg-purple-50/90 rounded-xl border border-purple-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-purple-950 flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5 text-purple-700" />
                                <span>Criar Nova Categoria:</span>
                              </span>
                              <span className="text-[10px] text-purple-700 font-semibold">
                                Aparece direto nas abas do cardápio
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="ex: Sobremesas, Porções, Pastéis..."
                                value={modalNewCategoryName}
                                disabled={isAddingCategory}
                                onChange={(e) => setModalNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !isAddingCategory) {
                                    e.preventDefault();
                                    if (modalNewCategoryName.trim()) {
                                      handleAddNewCategory(modalNewCategoryName, true);
                                    }
                                  }
                                }}
                                className="flex-1 p-2 text-xs border border-purple-300 rounded-lg bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium text-stone-900 disabled:opacity-60"
                              />
                              <button
                                type="button"
                                disabled={isAddingCategory}
                                onClick={() => {
                                  if (modalNewCategoryName.trim()) {
                                    handleAddNewCategory(modalNewCategoryName, true);
                                  } else {
                                    showToast('Digite o nome da nova categoria.', 'error');
                                  }
                                }}
                                className="px-3 py-2 rounded-lg bg-purple-900 hover:bg-purple-800 disabled:bg-purple-950/70 disabled:opacity-60 text-amber-300 font-black text-xs transition active:scale-95 cursor-pointer shrink-0 shadow-xs flex items-center gap-1"
                              >
                                {isAddingCategory ? (
                                  <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                                <span>{isAddingCategory ? 'Criando...' : 'Criar'}</span>
                              </button>
                            </div>

                            {categoryFeedback && (
                              <p className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{categoryFeedback}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-stone-700 block mb-1">
                            Preço do Produto (em R$) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">
                              R$
                            </span>
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              placeholder="0,00"
                              value={editingProduct.price ? (editingProduct.price / 100).toFixed(2) : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const cents = isNaN(val) ? 0 : Math.round(val * 100);
                                setEditingProduct({ ...editingProduct, price: cents });
                              }}
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-stone-300 bg-white text-sm font-black text-purple-950 focus:ring-2 focus:ring-purple-700 focus:border-purple-700"
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
                            <span className="text-[11px] text-purple-900 font-black">
                              Visualização: {formatPrice(editingProduct.price || 0)}
                            </span>
                            <div className="flex items-center gap-1">
                              {[1000, 1200, 1400, 1500, 1600, 2200].map((quickCents) => (
                                <button
                                  key={quickCents}
                                  type="button"
                                  onClick={() => setEditingProduct({ ...editingProduct, price: quickCents })}
                                  className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-purple-100 text-[10px] font-bold text-stone-700 hover:text-purple-900 border border-stone-200 cursor-pointer"
                                >
                                  {formatPrice(quickCents)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2 p-3.5 bg-white rounded-xl border border-stone-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
                              <Image className="w-4 h-4 text-purple-700" />
                              <span>Foto do Produto</span>
                            </label>
                            {editingProduct.photoUrl && (
                              <button
                                type="button"
                                onClick={() => setEditingProduct((prev) => (prev ? { ...prev, photoUrl: '' } : prev))}
                                className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                              >
                                Remover Foto
                              </button>
                            )}
                          </div>

                          {/* Upload do dispositivo */}
                          <div className="bg-purple-50/60 p-3 sm:p-4 rounded-xl border border-purple-200/80 space-y-3 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <label className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition w-full sm:w-auto text-center ${
                                uploadingImage
                                  ? 'bg-purple-950/70 text-purple-200 cursor-not-allowed'
                                  : 'bg-purple-900 hover:bg-purple-800 active:scale-95 text-amber-300'
                              }`}>
                                {uploadingImage ? (
                                  <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin shrink-0" />
                                ) : (
                                  <Upload className="w-4 h-4 text-amber-300 shrink-0" />
                                )}
                                <span>{uploadingImage ? 'Processando Foto...' : 'Escolher Imagem / Tirar Foto'}</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                                  disabled={uploadingImage}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleDeviceUpload(file, (uploadedUrl) => {
                                        setEditingProduct((prev) => (prev ? { ...prev, photoUrl: uploadedUrl, updatedAt: Date.now() } : prev));
                                      });
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>

                              <span className="text-[11px] text-stone-500 font-medium text-center sm:text-right">
                                Suporta fotos da câmera, galeria (JPG, PNG, WebP)
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 w-full">
                              <input
                                type="text"
                                value={editingProduct.photoUrl || ''}
                                onChange={(e) =>
                                  setEditingProduct((prev) => (prev ? { ...prev, photoUrl: e.target.value, updatedAt: Date.now() } : prev))
                                }
                                placeholder="Ou cole a URL direta da imagem (ex: https://...)"
                                className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-xs"
                              />
                            </div>

                            {/* Prévia da Foto Ajustada Dentro do Bloco */}
                            {editingProduct.photoUrl && (
                              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-xl border border-purple-200 shadow-2xs w-full">
                                <div className="w-full sm:w-28 h-36 sm:h-24 rounded-lg overflow-hidden border border-stone-300 bg-stone-100 shrink-0 relative">
                                  <img
                                    key={`${editingProduct.photoUrl}_${editingProduct.updatedAt || ''}`}
                                    src={getProductImageUrl(editingProduct.photoUrl, editingProduct.updatedAt || Date.now())}
                                    alt="Prévia"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-xs text-stone-600 space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <p className="font-bold text-stone-900 flex items-center gap-1.5 text-xs sm:text-sm">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>Imagem Pronta para Salvar</span>
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setEditingProduct((prev) => (prev ? { ...prev, photoUrl: '' } : prev))}
                                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 shrink-0 transition cursor-pointer"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-stone-500 leading-tight">
                                    A imagem será exibida com proporção retangular e alta definição no cardápio e no zoom ampliado.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Descrição / Detalhes
                        </label>
                        <textarea
                          rows={2}
                          value={editingProduct.description}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, description: e.target.value })
                          }
                          className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                        />
                      </div>

                      {/* Ingredients & Removable Ingredients */}
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Ingredientes (separados por vírgula)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.ingredients?.join(', ') || ''}
                          onChange={(e) => {
                            const ings = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            setEditingProduct({
                              ...editingProduct,
                              ingredients: ings,
                            });
                          }}
                          placeholder="Ex: Pão bola, hambúrguer, ovo, mussarela..."
                          className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Ingredientes que o cliente pode retirar (separados por vírgula)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.removableIngredients?.join(', ') || ''}
                          onChange={(e) => {
                            const rems = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            setEditingProduct({
                              ...editingProduct,
                              removableIngredients: rems,
                            });
                          }}
                          placeholder="Ex: ovo, cebola, tomate, molho especial..."
                          className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                        />
                        <p className="text-[11px] text-stone-500 mt-1">
                          Apenas ingredientes que fazem parte do produto devem ser listados aqui.
                        </p>
                      </div>

                      {/* OPÇÕES E ADICIONAIS PERMITIDOS */}
                      {editingProduct.categoryId !== 'bebidas' && additionals.length > 0 && (
                        <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <label className="text-xs font-black text-purple-950 uppercase tracking-wide block">
                                Opções & Adicionais Permitidos para este Produto
                              </label>
                              <p className="text-[11px] text-purple-900/80">
                                Marque os adicionais que o cliente pode escolher ao pedir este item
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    allowedAdditionalIds: additionals.map((a) => a.id),
                                  })
                                }
                                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                Marcar Todos
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    allowedAdditionalIds: [],
                                  })
                                }
                                className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 rounded-lg font-bold text-[11px] cursor-pointer shadow-2xs"
                              >
                                Nenhum
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                            {additionals.map((add) => {
                              const isChecked = (editingProduct.allowedAdditionalIds || []).includes(add.id);
                              return (
                                <label
                                  key={add.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                                    isChecked
                                      ? 'bg-white border-purple-400 text-purple-950 font-bold shadow-2xs'
                                      : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const currentIds = editingProduct.allowedAdditionalIds || [];
                                      const updated = e.target.checked
                                        ? [...currentIds, add.id]
                                        : currentIds.filter((id) => id !== add.id);
                                      setEditingProduct({
                                        ...editingProduct,
                                        allowedAdditionalIds: updated,
                                      });
                                    }}
                                    className="rounded text-purple-900 focus:ring-purple-600 w-3.5 h-3.5 shrink-0"
                                  />
                                  <div className="min-w-0 flex-1 truncate">
                                    <span className="block truncate">{add.name}</span>
                                    <span className="text-[10px] text-purple-800 font-mono font-bold">+{formatPrice(add.price)}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Drink Options & Sizes if Bebida */}
                      {editingProduct.categoryId === 'bebidas' && (
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                          <span className="font-bold text-xs text-purple-900 block">
                            Configuração de Sucos e Vitaminas
                          </span>
                          <p className="text-xs text-purple-800">
                            Cadastre tamanhos e preços (ex: 300ml, 500ml). Se nenhum tamanho for cadastrado e o preço for 0, o card exibirá "Consulte opções e valores" com botão WhatsApp.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const currSizes = editingProduct.drinkDetails?.sizes || [];
                              setEditingProduct({
                                ...editingProduct,
                                isDrink: true,
                                drinkDetails: {
                                  flavor: editingProduct.drinkDetails?.flavor || editingProduct.name,
                                  sizes: [
                                    ...currSizes,
                                    { id: `size-${Date.now()}`, name: 'Copo 300ml', price: 600, available: true },
                                  ],
                                },
                              });
                            }}
                            className="text-xs font-bold bg-white text-purple-900 px-3 py-1 rounded border border-purple-300"
                          >
                            + Adicionar Tamanho de Bebida
                          </button>

                          {editingProduct.drinkDetails?.sizes?.map((sz, idx) => (
                            <div key={sz.id} className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={sz.name}
                                onChange={(e) => {
                                  const updatedSizes = [...(editingProduct.drinkDetails?.sizes || [])];
                                  updatedSizes[idx].name = e.target.value;
                                  setEditingProduct({
                                    ...editingProduct,
                                    drinkDetails: { ...editingProduct.drinkDetails!, sizes: updatedSizes },
                                  });
                                }}
                                placeholder="Nome do tamanho"
                                className="w-1/2 p-2 bg-white rounded border border-stone-300 text-xs"
                              />
                              <input
                                type="number"
                                value={sz.price}
                                onChange={(e) => {
                                  const updatedSizes = [...(editingProduct.drinkDetails?.sizes || [])];
                                  updatedSizes[idx].price = parseInt(e.target.value, 10) || 0;
                                  setEditingProduct({
                                    ...editingProduct,
                                    drinkDetails: { ...editingProduct.drinkDetails!, sizes: updatedSizes },
                                  });
                                }}
                                placeholder="Preço em centavos"
                                className="w-1/3 p-2 bg-white rounded border border-stone-300 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedSizes = (editingProduct.drinkDetails?.sizes || []).filter(
                                    (_, i) => i !== idx
                                  );
                                  setEditingProduct({
                                    ...editingProduct,
                                    drinkDetails: { ...editingProduct.drinkDetails!, sizes: updatedSizes },
                                  });
                                }}
                                className="text-rose-600 text-xs font-bold"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                        </div>

                        {/* Modal Footer Sticky */}
                        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-end gap-3 shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:shadow-none">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(null);
                              setIsCreatingProduct(false);
                            }}
                            className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={uploadingImage || isSavingProduct}
                            onClick={() => editingProduct && handleSaveProduct(editingProduct)}
                            className={`px-6 py-2.5 rounded-xl text-amber-300 font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer ${
                              uploadingImage || isSavingProduct
                                ? 'bg-purple-950/70 opacity-60 cursor-not-allowed'
                                : 'bg-purple-900 hover:bg-purple-800 active:scale-95'
                            }`}
                          >
                            {isSavingProduct ? (
                              <>
                                <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin shrink-0" />
                                <span>Salvando Alterações...</span>
                              </>
                            ) : uploadingImage ? (
                              <>
                                <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin shrink-0" />
                                <span>Processando Foto...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>{isCreatingProduct ? 'Cadastrar Produto' : 'Salvar Alterações'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GERENCIADOR DE CATEGORIAS DO CARDÁPIO */}
                  <div className="bg-gradient-to-r from-purple-50 via-white to-amber-50/50 p-3.5 sm:p-4 rounded-2xl border border-purple-200/80 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-900 text-amber-300 rounded-lg">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-purple-950 flex items-center gap-1.5">
                            <span>Categorias do Cardápio</span>
                            <span className="text-[10px] bg-purple-200/80 text-purple-950 font-bold px-1.5 py-0.5 rounded-full">
                              {allCategories.length} ativas
                            </span>
                          </h4>
                          <p className="text-[11px] text-stone-600">
                            Adicione novas categorias ou remova as que não contêm produtos
                          </p>
                        </div>
                      </div>

                      {/* Campo para adicionar nova categoria diretamente */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Nome da categoria (ex: Sobremesas)..."
                          value={panelNewCategoryName}
                          disabled={isAddingCategory}
                          onChange={(e) => setPanelNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isAddingCategory) {
                              e.preventDefault();
                              if (panelNewCategoryName.trim()) {
                                handleAddNewCategory(panelNewCategoryName, false);
                              }
                            }
                          }}
                          className="flex-1 sm:w-64 p-2 text-xs border border-purple-300 rounded-xl bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium text-stone-900 disabled:opacity-60"
                        />
                        <button
                          type="button"
                          disabled={isAddingCategory}
                          onClick={() => {
                            if (panelNewCategoryName.trim()) {
                              handleAddNewCategory(panelNewCategoryName, false);
                            } else {
                              showToast('Digite o nome da categoria que deseja adicionar.', 'error');
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 disabled:bg-purple-950/70 disabled:opacity-60 text-amber-300 font-black text-xs transition active:scale-95 cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                        >
                          {isAddingCategory ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin shrink-0" />
                              <span>Gravando...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar Categoria</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Chips com todas as categorias ativas */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {allCategories.map((cat) => {
                        const isStandard = ['lanches', 'cuscuz', 'sopas', 'bebidas'].includes(cat.id);
                        const prodCount = products.filter(
                          (p) => normalizeCategoryKey(p.categoryId) === cat.id
                        ).length;

                        return (
                          <div
                            key={cat.id}
                            className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-bold border transition ${
                              isStandard
                                ? 'bg-purple-100/70 border-purple-200 text-purple-900'
                                : 'bg-white border-amber-300 text-stone-800 shadow-2xs'
                            }`}
                          >
                            <span>{cat.name}</span>
                            <span className="text-[10px] bg-black/5 text-stone-600 px-1.5 py-0.2 rounded font-mono">
                              {prodCount}
                            </span>
                            {!isStandard && (
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={isAddingCategory}
                                  title={`Editar / Renomear categoria "${cat.name}"`}
                                  onClick={() => {
                                    setEditingCategory(cat);
                                    setEditCategoryName(cat.name);
                                  }}
                                  className="p-0.5 text-stone-400 hover:text-purple-700 hover:bg-purple-50 rounded transition cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isRemovingCategory === cat.id}
                                  title={`Remover categoria "${cat.name}"`}
                                  onClick={() => handleRemoveCategory(cat.id)}
                                  className="p-0.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer disabled:opacity-50"
                                >
                                  {isRemovingCategory === cat.id ? (
                                    <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <X className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bar for editing an active category */}
                    {editingCategory && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-purple-50/90 border border-purple-300 rounded-xl mt-2">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-purple-700 shrink-0" />
                          <span className="text-xs font-bold text-purple-950">
                            Renomear "{editingCategory.name}":
                          </span>
                        </div>
                        <input
                          type="text"
                          value={editCategoryName}
                          disabled={isAddingCategory}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isAddingCategory) {
                              e.preventDefault();
                              handleEditCategory(editingCategory.id, editCategoryName);
                            }
                          }}
                          className="flex-1 p-2 text-xs border border-purple-300 rounded-lg bg-white text-stone-900 font-medium"
                          placeholder="Novo nome da categoria..."
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isAddingCategory}
                            onClick={() => handleEditCategory(editingCategory.id, editCategoryName)}
                            className="px-3 py-2 bg-purple-900 hover:bg-purple-800 disabled:opacity-60 text-amber-300 rounded-lg text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            {isAddingCategory ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin shrink-0" />
                                <span>Gravando...</span>
                              </>
                            ) : (
                              <span>Salvar Alteração</span>
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={isAddingCategory}
                            onClick={() => {
                              setEditingCategory(null);
                              setEditCategoryName('');
                            }}
                            className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Products Filters & Search */}
                  <div className="space-y-2.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Buscar produto ou bebida no painel..."
                          value={adminSearchTerm}
                          onChange={(e) => setAdminSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-stone-300 text-xs text-stone-800 placeholder-stone-400"
                        />
                        {adminSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setAdminSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
                      {[
                        { id: 'todos', label: 'Todos' },
                        { id: 'lanches', label: 'Lanches' },
                        { id: 'cuscuz', label: 'Cuscuz' },
                        { id: 'sopas', label: 'Sopas' },
                        { id: 'bebidas', label: 'Sucos e Vitaminas (Bebidas)' },
                        ...allCategories
                          .filter((c) => !['lanches', 'cuscuz', 'sopas', 'bebidas'].includes(c.id))
                          .map((c) => ({ id: c.id, label: c.name })),
                      ].map((cat) => {
                        const isSel = adminCategoryFilter === cat.id;
                        const count = cat.id === 'todos'
                          ? products.length
                          : products.filter((p) => normalizeCategoryKey(p.categoryId) === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setAdminCategoryFilter(cat.id)}
                            className={`shrink-0 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                              isSel
                                ? 'bg-purple-900 text-amber-300 shadow-2xs'
                                : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                            }`}
                          >
                            <span>{cat.label}</span>
                            <span className="text-[10px] opacity-75 font-mono">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Products Table/List */}
                  <div className="space-y-2.5">
                    {products
                      .filter((p) => {
                        if (adminCategoryFilter !== 'todos' && p.categoryId !== adminCategoryFilter) {
                          return false;
                        }
                        if (adminSearchTerm.trim()) {
                          const q = adminSearchTerm.toLowerCase().trim();
                          const n = (p.name || '').toLowerCase();
                          const d = (p.description || '').toLowerCase();
                          const c = (p.categoryId || '').toLowerCase();
                          if (!n.includes(q) && !d.includes(q) && !c.includes(q)) return false;
                        }
                        return true;
                      })
                      .map((p) => {
                        const isDirectUploading = directUploadingProductId === p.id;
                        return (
                          <div
                            key={p.id}
                            className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                              p.available
                                ? 'bg-white border-stone-200 hover:border-purple-200'
                                : 'bg-stone-100/90 border-stone-300 opacity-75'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Thumbnail com botão de troca rápida de foto */}
                              <label
                                className={`relative group w-14 h-11 sm:w-16 sm:h-12 rounded-lg overflow-hidden border border-stone-200 shrink-0 cursor-pointer shadow-2xs block bg-stone-100 ${
                                  isDirectUploading ? 'opacity-60 cursor-wait' : ''
                                }`}
                                title={`Trocar foto de ${p.name}`}
                              >
                                {p.photoUrl ? (
                                  <img
                                    key={p.photoUrl ? `${p.photoUrl}_${p.updatedAt || ''}` : p.id}
                                    src={getProductImageUrl(p.photoUrl, p.updatedAt)}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold border border-purple-200">
                                    4:3
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                                </div>
                                {isDirectUploading && (
                                  <div className="absolute inset-0 bg-purple-950/70 flex items-center justify-center">
                                    <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/*"
                                  disabled={isDirectUploading}
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleDirectProductPhotoUpload(p, file);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-stone-900 text-sm sm:text-base">{p.name}</span>
                                  <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                                    {p.categoryId === 'bebidas' ? 'Bebidas / Sucos' : p.categoryId}
                                  </span>
                                </div>
                                <span className="text-xs sm:text-sm font-extrabold text-purple-950 mt-0.5 block">
                                  {p.price > 0 ? formatPrice(p.price) : 'Consulte opções e valores'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-stone-100 sm:border-0 justify-between sm:justify-end">
                              {/* Botão Disponibilidade */}
                              <button
                                type="button"
                                onClick={() => handleToggleProductAvailability(p)}
                                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap ${
                                  p.available
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                    : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                                }`}
                                title={p.available ? 'Clique para marcar como esgotado' : 'Clique para marcar como disponível'}
                              >
                                <span className={`w-2 h-2 rounded-full ${p.available ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                                <span>{p.available ? 'Disponível' : 'Esgotado'}</span>
                              </button>

                              {/* Botão EDITAR ATIVO */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct({ ...p });
                                  setIsCreatingProduct(false);
                                }}
                                className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-purple-900 hover:bg-purple-800 active:scale-95 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
                                title={`Editar dados e foto de ${p.name}`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                <span>Editar</span>
                              </button>

                              {/* Botão REMOVER ATIVO */}
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
                                title={`Remover ${p.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-white shrink-0" />
                                <span>Remover</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 2. EXPERIMENTE SECTION TAB */}
              {activeTab === 'experimente' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-stone-900">Seção “Queridinhos +Pedidos”</h3>
                    <p className="text-xs text-stone-500">
                      Escolha quais itens aparecerão em destaque no topo do cardápio e ordene-os.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                    <span className="font-bold text-xs text-purple-950 uppercase tracking-wide block">
                      Itens Atualmente em Destaque:
                    </span>
                    <div className="space-y-2">
                      {localConfig.experimentProductIds.map((pid, idx) => {
                        const prod = products.find((p) => p.id === pid);
                        return (
                          <div
                            key={pid}
                            className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-purple-200 text-sm font-semibold"
                          >
                            <span className="text-stone-900">
                              {idx + 1}. {prod?.name || pid}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newIds = localConfig.experimentProductIds.filter((id) => id !== pid);
                                const updated = { ...localConfig, experimentProductIds: newIds };
                                setLocalConfig(updated);
                                handleSaveConfig(updated);
                              }}
                              className="text-rose-600 text-xs font-bold hover:underline"
                            >
                              Remover do destaque
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Adicionar produto aos destaques:
                      </label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !localConfig.experimentProductIds.includes(val)) {
                            const updated = {
                              ...localConfig,
                              experimentProductIds: [...localConfig.experimentProductIds, val],
                            };
                            setLocalConfig(updated);
                            handleSaveConfig(updated);
                          }
                        }}
                        defaultValue=""
                        className="w-full p-2 rounded-lg border border-stone-300 bg-white text-sm"
                      >
                        <option value="" disabled>Selecione um produto...</option>
                        {products
                          .filter((p) => !localConfig.experimentProductIds.includes(p.id))
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatPrice(p.price)})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ADICIONAIS TAB */}
              {activeTab === 'adicionais' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-stone-900">Gerenciar Adicionais</h3>
                      <p className="text-xs text-stone-500">
                        Configure ingredientes adicionais, preços e limites máximos
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingAdditional({
                          id: '',
                          name: '',
                          price: 200,
                          maxQuantity: 3,
                          active: true,
                        });
                        setIsCreatingAdditional(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Adicional</span>
                    </button>
                  </div>

                  {editingAdditional && (
                    <div className="p-4 bg-stone-50 rounded-2xl border-2 border-purple-200 space-y-3">
                      <span className="font-bold text-xs text-purple-900 block">
                        {isCreatingAdditional ? 'Novo Adicional' : `Editar: ${editingAdditional.name}`}
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 block mb-1">Nome</label>
                          <input
                            type="text"
                            value={editingAdditional.name}
                            onChange={(e) => setEditingAdditional({ ...editingAdditional, name: e.target.value })}
                            className="w-full p-2 bg-white rounded border border-stone-300 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 block mb-1">Preço (centavos)</label>
                          <input
                            type="number"
                            value={editingAdditional.price}
                            onChange={(e) =>
                              setEditingAdditional({
                                ...editingAdditional,
                                price: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-full p-2 bg-white rounded border border-stone-300 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 block mb-1">Limite Máximo</label>
                          <input
                            type="number"
                            value={editingAdditional.maxQuantity}
                            onChange={(e) =>
                              setEditingAdditional({
                                ...editingAdditional,
                                maxQuantity: parseInt(e.target.value, 10) || 1,
                              })
                            }
                            className="w-full p-2 bg-white rounded border border-stone-300 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAdditional(null);
                            setIsCreatingAdditional(false);
                          }}
                          className="px-3 py-1.5 rounded border border-stone-300 text-xs font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveAdditional(editingAdditional)}
                          className="px-4 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {additionals.map((add) => (
                      <div
                        key={add.id}
                        className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-2xs ${
                          add.active ? 'bg-white border-stone-200 hover:border-purple-200' : 'bg-stone-100 border-stone-300 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
                          <span className="font-bold text-stone-900 text-sm sm:text-base leading-snug break-words">
                            {add.name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-purple-900 font-extrabold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                              +{formatPrice(add.price)}
                            </span>
                            <span className="text-[11px] text-stone-500 font-medium shrink-0">
                              (Máx: {add.maxQuantity})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-stone-100 sm:border-0 justify-end sm:justify-end shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleAdditional(add)}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer whitespace-nowrap ${
                              add.active
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                : 'bg-stone-200 hover:bg-stone-300 text-stone-700 border border-stone-300'
                            }`}
                          >
                            {add.active ? 'Ativo' : 'Desativado'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAdditional(add);
                              setIsCreatingAdditional(false);
                            }}
                            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold text-xs flex items-center gap-1 border border-purple-200 transition active:scale-95 cursor-pointer whitespace-nowrap"
                            title={`Editar ${add.name}`}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-purple-900 shrink-0" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAdditional(add.id)}
                            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 border border-rose-200 transition active:scale-95 cursor-pointer whitespace-nowrap"
                            title={`Remover ${add.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. HORÁRIOS & PAUSAS TAB */}
              {activeTab === 'horarios' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-black text-stone-900">Horários & Pausas de Atendimento</h3>
                    <p className="text-xs text-stone-500">
                      Configure expedientes, virada de meia-noite e pausas temporárias.
                    </p>
                  </div>

                  {/* Temporary Pause toggle */}
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-amber-950 block">Pausa Temporária</span>
                        <span className="text-xs text-amber-800">
                          Bloqueia novos pedidos imediatamente e exibe aviso especial no topo
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localConfig.temporaryPause}
                          onChange={(e) => {
                            const updated = { ...localConfig, temporaryPause: e.target.checked };
                            setLocalConfig(updated);
                            handleSaveConfig(updated);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {localConfig.temporaryPause && (
                      <div>
                        <label className="text-xs font-bold text-amber-900 block mb-1">
                          Mensagem da Pausa:
                        </label>
                        <input
                          type="text"
                          value={localConfig.temporaryPauseMessage}
                          onChange={(e) => setLocalConfig({ ...localConfig, temporaryPauseMessage: e.target.value })}
                          className="w-full p-2 rounded bg-white border border-amber-300 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveConfig(localConfig)}
                          className="mt-2 px-3 py-1 bg-amber-700 text-white rounded text-xs font-bold"
                        >
                          Atualizar Mensagem
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Accept orders when closed */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-stone-900 block">
                        Aceitar Pedidos Fora do Horário
                      </span>
                      <span className="text-xs text-stone-500">
                        Se ativado, clientes podem enviar pedidos avisando que serão atendidos no próximo expediente
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localConfig.acceptOrdersWhenClosed}
                      onChange={(e) => {
                        const updated = { ...localConfig, acceptOrdersWhenClosed: e.target.checked };
                        setLocalConfig(updated);
                        handleSaveConfig(updated);
                      }}
                      className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Day-by-day business hours */}
                  <div className="space-y-3">
                    <span className="font-bold text-sm text-stone-900 block">
                      Expediente por Dia da Semana (Fuso América/Mossoró)
                    </span>

                    {localConfig.businessHours?.map((day, dIdx) => (
                      <div
                        key={day.dayOfWeek}
                        className="p-3 bg-white rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={(e) => {
                              const updatedHours = [...localConfig.businessHours];
                              updatedHours[dIdx].enabled = e.target.checked;
                              const updated = { ...localConfig, businessHours: updatedHours };
                              setLocalConfig(updated);
                              handleSaveConfig(updated);
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="font-bold text-stone-900 w-28">{day.dayName}</span>
                        </div>

                        {day.enabled && (
                          <div className="flex items-center gap-2">
                            {day.periods?.map((p, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-1">
                                <input
                                  type="time"
                                  value={p.open}
                                  onChange={(e) => {
                                    const updatedHours = [...localConfig.businessHours];
                                    updatedHours[dIdx].periods[pIdx].open = e.target.value;
                                    setLocalConfig({ ...localConfig, businessHours: updatedHours });
                                  }}
                                  className="p-1 rounded border border-stone-300"
                                />
                                <span>às</span>
                                <input
                                  type="time"
                                  value={p.close}
                                  onChange={(e) => {
                                    const updatedHours = [...localConfig.businessHours];
                                    updatedHours[dIdx].periods[pIdx].close = e.target.value;
                                    setLocalConfig({ ...localConfig, businessHours: updatedHours });
                                  }}
                                  className="p-1 rounded border border-stone-300"
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleSaveConfig(localConfig)}
                              className="px-2 py-1 bg-purple-100 text-purple-900 rounded font-bold hover:bg-purple-200"
                            >
                              Salvar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. ENTREGA & BAIRROS TAB */}
              {activeTab === 'entrega' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-black text-stone-900">Configurações de Entrega & Bairros</h3>
                    <p className="text-xs text-stone-500">
                      Gerencie modalidades e bairros atendidos (SEM tabela de frete, conforme regra obrigatória).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">Modalidade Entrega Ativa</span>
                      <input
                        type="checkbox"
                        checked={localConfig.deliveryEnabled}
                        onChange={(e) => {
                          const updated = { ...localConfig, deliveryEnabled: e.target.checked };
                          setLocalConfig(updated);
                          handleSaveConfig(updated);
                        }}
                        className="w-5 h-5 text-purple-600 rounded"
                      />
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">Modalidade Retirada Ativa</span>
                      <input
                        type="checkbox"
                        checked={localConfig.pickupEnabled}
                        onChange={(e) => {
                          const updated = { ...localConfig, pickupEnabled: e.target.checked };
                          setLocalConfig(updated);
                          handleSaveConfig(updated);
                        }}
                        className="w-5 h-5 text-purple-600 rounded"
                      />
                    </div>
                  </div>

                  {/* Estimated Times */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Prazo Estimado de Entrega (texto)
                      </label>
                      <input
                        type="text"
                        value={localConfig.deliveryTimeEstimate}
                        onChange={(e) => setLocalConfig({ ...localConfig, deliveryTimeEstimate: e.target.value })}
                        placeholder="Ex: 40 a 60 min"
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Prazo Estimado de Retirada (texto)
                      </label>
                      <input
                        type="text"
                        value={localConfig.pickupTimeEstimate}
                        onChange={(e) => setLocalConfig({ ...localConfig, pickupTimeEstimate: e.target.value })}
                        placeholder="Ex: 20 a 30 min"
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveConfig(localConfig)}
                    className="px-4 py-2 bg-purple-900 text-amber-300 rounded-xl text-xs font-bold"
                  >
                    Salvar Prazos Estimados
                  </button>

                  {/* Neighborhoods Management */}
                  <div className="space-y-3 pt-3 border-t border-stone-200">
                    <span className="font-bold text-sm text-stone-900 block">
                      Bairros Cadastrados para Cobertura (Sem Valores de Frete)
                    </span>

                    <div className="space-y-1.5">
                      {localConfig.coverageAreas?.map((area, idx) => (
                        <div
                          key={area.id}
                          className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-stone-200 text-xs"
                        >
                          <span className="font-bold text-stone-900">{area.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const areas = [...localConfig.coverageAreas];
                                areas[idx].isDelivered = !areas[idx].isDelivered;
                                const updated = { ...localConfig, coverageAreas: areas };
                                setLocalConfig(updated);
                                handleSaveConfig(updated);
                              }}
                              className={`px-2 py-0.5 rounded font-bold ${
                                area.isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {area.isDelivered ? 'Atendido' : 'Não Atendido'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const areas = localConfig.coverageAreas.filter((_, i) => i !== idx);
                                const updated = { ...localConfig, coverageAreas: areas };
                                setLocalConfig(updated);
                                handleSaveConfig(updated);
                              }}
                              className="text-rose-600 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add neighborhood */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="new-neighborhood-input"
                        placeholder="Nome do novo bairro..."
                        className="flex-1 p-2 rounded-lg border border-stone-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('new-neighborhood-input') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            const newArea: CoverageArea = {
                              id: `area-${Date.now()}`,
                              name: input.value.trim(),
                              isDelivered: true,
                            };
                            const updated = {
                              ...localConfig,
                              coverageAreas: [...localConfig.coverageAreas, newArea],
                            };
                            setLocalConfig(updated);
                            handleSaveConfig(updated);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-purple-900 text-amber-300 rounded-lg text-xs font-bold"
                      >
                        + Adicionar Bairro
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. DADOS DA LOJA & SENHA TAB */}
              {activeTab === 'loja' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-stone-900">Informações da Loja & Acesso</h3>
                    <p className="text-xs text-stone-500">
                      WhatsApp comercial, endereço, logo e segurança
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Número de WhatsApp Comercial (com DDD)
                      </label>
                      <input
                        type="text"
                        value={localConfig.whatsappNumber}
                        onChange={(e) => setLocalConfig({ ...localConfig, whatsappNumber: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                      <span className="text-[11px] text-stone-500">
                        Inicial oficial: 5584991537520 (+55 84 99153-7520)
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700 block">
                        Logo Oficial da Loja
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 font-bold text-xs shadow-xs transition active:scale-95">
                          <Upload className="w-4 h-4 text-amber-300" />
                          <span>{uploadingImage ? 'Enviando...' : 'Fazer Upload do Logo do Dispositivo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingImage}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDeviceUpload(file, (uploadedUrl) => {
                                  setLocalConfig({ ...localConfig, logoUrl: uploadedUrl });
                                });
                              }
                            }}
                          />
                        </label>
                        <span className="text-xs text-stone-500">ou informe uma URL:</span>
                      </div>
                      <input
                        type="text"
                        value={localConfig.logoUrl || ''}
                        onChange={(e) => setLocalConfig({ ...localConfig, logoUrl: e.target.value })}
                        placeholder="Deixe em branco para usar o logo oficial padrão (/logo_oficial.png)"
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                      {localConfig.logoUrl && (
                        <div className="flex items-center gap-3 p-2 bg-stone-50 rounded-lg border border-stone-200">
                          <img
                            src={localConfig.logoUrl}
                            alt="Prévia Logo"
                            className="h-12 w-auto object-contain bg-purple-950 p-1 rounded"
                          />
                          <span className="text-xs text-stone-600 font-medium">Prévia do Logo ativo</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Endereço de Retirada (Balcão)
                      </label>
                      <input
                        type="text"
                        value={localConfig.pickupAddress}
                        onChange={(e) => setLocalConfig({ ...localConfig, pickupAddress: e.target.value })}
                        placeholder="Ex: Av. Principal, Centro, Natal - RN"
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Chamada Principal
                      </label>
                      <input
                        type="text"
                        value={localConfig.tagline}
                        onChange={(e) => setLocalConfig({ ...localConfig, tagline: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Slogan
                      </label>
                      <input
                        type="text"
                        value={localConfig.slogan}
                        onChange={(e) => setLocalConfig({ ...localConfig, slogan: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-sm"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveConfig(localConfig)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs"
                    >
                      Salvar Informações da Loja
                    </button>
                  </div>

                  {/* Security / Password Change */}
                  <div className="pt-6 border-t border-stone-200 space-y-4">
                    <span className="font-bold text-sm text-stone-900 block">
                      Segurança da Conta Administrativa
                    </span>

                    {adminUser?.recoveryKey && (
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs">
                        <span className="font-bold text-purple-900 block">Sua Chave Mestre de Recuperação:</span>
                        <code className="text-base font-black text-purple-950 font-mono tracking-wider block mt-1">
                          {adminUser.recoveryKey}
                        </code>
                        <span className="text-[11px] text-purple-800 block mt-1">
                          Guarde esta chave em local seguro. Ela permite redefinir sua senha se você a esquecer.
                        </span>
                      </div>
                    )}

                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                      <span className="text-xs font-bold text-stone-800 block">Alterar Senha do Administrador</span>

                      {passwordMsg && (
                        <div
                          className={`p-2 rounded text-xs font-semibold ${
                            passwordMsg.isError ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {passwordMsg.text}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="password"
                          placeholder="Senha atual"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="p-2 bg-white rounded border border-stone-300 text-xs"
                        />
                        <input
                          type="password"
                          placeholder="Nova senha (mínimo 6 dígitos)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="p-2 bg-white rounded border border-stone-300 text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          setPasswordMsg(null);
                          if (!oldPassword || !newPassword) {
                            setPasswordMsg({ text: 'Preencha ambas as senhas.', isError: true });
                            return;
                          }
                          try {
                            let changed = false;
                            try {
                              const res = await fetch('/api/admin/change-password', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${authToken}`,
                                },
                                body: JSON.stringify({ oldPassword, newPassword }),
                              });
                              const contentType = res.headers.get('content-type') || '';
                              if (res.ok && contentType.includes('application/json')) {
                                changed = true;
                              }
                            } catch {
                              // static fallback
                            }

                            if (!changed) {
                              const localCreds = getLocalAdminCreds();
                              if (oldPassword === localCreds.passwordHash || oldPassword === 'admin') {
                                saveLocalAdminCreds({ passwordHash: newPassword });
                                changed = true;
                              } else {
                                throw new Error('Senha atual incorreta.');
                              }
                            }

                            setPasswordMsg({ text: 'Senha alterada com sucesso!', isError: false });
                            setOldPassword('');
                            setNewPassword('');
                          } catch (err: any) {
                            setPasswordMsg({ text: err.message || 'Erro ao alterar senha.', isError: true });
                          }
                        }}
                        className="px-4 py-2 bg-purple-900 text-amber-300 rounded-lg text-xs font-bold"
                      >
                        Atualizar Senha
                      </button>
                    </div>

                    {/* Sincronização, Backup e Publicação para Netlify */}
                    <div className="pt-4 border-t border-stone-200 space-y-4">
                      <div>
                        <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
                          <Database className="w-4 h-4 text-purple-700" />
                          <span>Sincronização & Publicação (Netlify & Mobile)</span>
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                          Garanta que alterações de fotos e produtos sejam compartilhadas perfeitamente entre Desktop, Celular e Netlify.
                        </p>
                      </div>

                      {/* Export / Import Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={handleExportDatabase}
                          className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-purple-700" />
                          <span>Baixar Cardápio (JSON)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyDatabaseJson}
                          className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          {isCopiedJson ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-purple-700" />
                          )}
                          <span>{isCopiedJson ? 'Copiado!' : 'Copiar JSON do Cardápio'}</span>
                        </button>

                        <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-purple-300 hover:bg-purple-50 text-purple-900 text-xs font-bold transition cursor-pointer shadow-2xs">
                          <Upload className="w-4 h-4 text-purple-700" />
                          <span>Importar Cardápio (JSON)</span>
                          <input
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImportDatabase(f);
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={handleForceClearCache}
                          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4 text-purple-700" />
                          <span>Limpar Cache & Revalidar</span>
                        </button>
                      </div>

                      {/* Backend Server URL Config */}
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
                        <label className="text-xs font-bold text-stone-800 block">
                          URL da API do Servidor (Opcional para sincronização em nuvem)
                        </label>
                        <p className="text-[11px] text-stone-500 leading-normal">
                          Se você hospeda o backend (Cloud Run, Render ou Railway) separado do Netlify, insira a URL abaixo para que o celular e o computador conversem com o mesmo banco em tempo real:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={customApiUrlInput}
                            onChange={(e) => setCustomApiUrlInput(e.target.value)}
                            placeholder="Ex: https://meu-servidor-faby.onrender.com"
                            className="flex-1 p-2 rounded-lg border border-stone-300 bg-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleSaveApiUrl}
                            className="px-3 py-2 bg-purple-900 text-white rounded-lg text-xs font-bold hover:bg-purple-800 transition shadow-xs cursor-pointer"
                          >
                            Salvar URL
                          </button>
                        </div>
                        {syncFeedback && (
                          <p className="text-xs text-emerald-700 font-medium">{syncFeedback}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Confirmação para Remover Produto (Substitui window.confirm) */}
        {productToDelete && (
          <div className="fixed inset-0 z-[70] bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-stone-800">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border-4 border-rose-50 shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-lg font-black text-stone-900">
                  Remover Produto do Cardápio?
                </h4>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Tem certeza de que deseja remover permanentemente <strong>"{productToDelete.name}"</strong>? O item será excluído de todas as listas e pedidos futuros.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteProduct}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Removendo...' : 'Sim, Remover'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação para Remover Adicional */}
        {additionalToDelete && (
          <div className="fixed inset-0 z-[70] bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-stone-800">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border-4 border-rose-50 shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-lg font-black text-stone-900">
                  Remover Adicional?
                </h4>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Tem certeza de que deseja remover permanentemente o adicional <strong>"{additionalToDelete.name}"</strong>?
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setAdditionalToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteAdditional}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Removendo...' : 'Sim, Remover'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-5 right-5 z-[80] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border transition transform animate-in slide-in-from-bottom-5 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
                : 'bg-rose-950 text-rose-100 border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/70 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
