import type { ReactNode } from 'react';

export type StateStatus = 'loading' | 'ready' | 'empty' | 'error';

type StateBoxProps = {
  status: StateStatus;
  empty?: string;
  emptyText?: string;
  onRetry?: () => void;
  children?: ReactNode;
};

export function StateBox({
  status,
  empty = 'Nenhum dado encontrado',
  emptyText = 'Não há informações para exibir no momento.',
  onRetry,
  children,
}: StateBoxProps) {
  if (status === 'loading') {
    return (
      <div className="ec-state">
        <div className="ec-state-icon">...</div>
        <b>Carregando...</b>
        <small>Aguarde enquanto buscamos os dados.</small>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="ec-state">
        <div className="ec-state-icon">!</div>
        <b>Não foi possível carregar</b>
        <small>Ocorreu um problema ao buscar os dados.</small>

        {onRetry && (
          <button type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="ec-state">
        <div className="ec-state-icon">—</div>
        <b>{empty}</b>
        <small>{emptyText}</small>

        {onRetry && (
          <button type="button" onClick={onRetry}>
            Atualizar
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
