import React from 'react';

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    let isEn = false;
    let isLight = false;
    try {
      isEn = localStorage.getItem('kurdistan_app_lang') === 'en';
      isLight = localStorage.getItem('kurdistan_app_color_mode') === 'light';
    } catch {
      // ignore storage access issues
    }

    return (
      <div
        dir={isEn ? 'ltr' : 'rtl'}
        className={`min-h-screen w-full flex items-center justify-center p-6 font-sans ${
          isLight ? 'bg-[#f7f6f2] text-slate-900' : 'bg-[#05070e] text-slate-100'
        }`}
      >
        <div
          className={`w-full max-w-md rounded-2xl border p-6 text-center space-y-4 shadow-2xl ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#0b1020] border-amber-500/30'
          }`}
        >
          <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xl font-black">
            !
          </div>
          <h1 className="text-lg font-extrabold">
            {isEn ? 'Unexpected Page Error' : 'هەڵەیەکی چاوەڕواننەکراو ڕوویدا'}
          </h1>
          <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {isEn
              ? 'A display error occurred while rendering this view. Reloading the page usually resolves it immediately.'
              : 'لە کاتی پیشاندانی ئەم پەڕەیەدا کێشەیەک ڕوویدا. نوێکردنەوەی پەڕەکە دۆخەکە چاک دەکاتەوە.'}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer transition-colors"
          >
            {isEn ? 'Reload Application' : 'نوێکردنەوەی پەڕە'}
          </button>
        </div>
      </div>
    );
  }
}
