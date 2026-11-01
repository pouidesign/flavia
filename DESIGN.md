# Minha Vida · Design System

Estilo baseado nas **Apple Human Interface Guidelines** (clareza, deferência, profundidade).
Referência visual interativa: abra `design-system.html`. Fonte dos tokens: `css/tokens.css`.

## Regras de ouro
1. Use **tokens**, nunca valores soltos (cores, tamanhos, espaços, raios).
2. **Uma cor de destaque** (`--tint`, índigo) para ações e seleção.
3. **Cor nunca sozinha**: sempre com texto, ícone ou posição.
4. Alvo de toque mínimo **44px** (`--hit`).
5. Claro e escuro automáticos (`light-dark()`); forçar com `<html data-theme="light|dark">`.
6. Respeitar *reduzir movimento* e *aumentar contraste* (já tratado em `tokens.css`).

## Tokens
| Grupo | Tokens | Observação |
|---|---|---|
| Cores do sistema | `--sys-red/orange/yellow/green/mint/teal/blue/indigo/purple/pink/brown` | Variantes claro/escuro da Apple |
| Fundos | `--bg-grouped` (página), `--bg-cell` (cards), `--bg-cell-2`, `--bg-elevated` | Estilo “grouped” do iOS |
| Texto | `--label`, `--label-2`, `--label-3`, `--separator`, `--hairline` | `--label-3` só para dicas |
| Fills | `--fill`, `--fill-strong`, `--segment-thumb` | Controles translúcidos |
| Semânticos | `--tint`, `--tint-ink`, `--success`, `--warning`, `--danger` | |
| Humor | `--mood-1` … `--mood-5` | vermelho → azul-petróleo |
| Tipografia | `--type-large-title` … `--type-caption-2` | Atalhos `font:`; SF Pro |
| Espaço | `--s-1` (4) … `--s-10` (40), `--gutter` 16 | Grade de 4pt |
| Cantos | `--r-xs` 6, `--r-sm` 10, `--r-md` 12, `--r-lg` 16, `--r-xl` 22, `--r-sheet` 28, `--r-capsule` | Squircle quando suportado |
| Materiais | `--material-bar`, `--material-blur`, `--scrim` | Barras e avisos translúcidos |
| Elevação | `--shadow-card`, `--shadow-float`, `--shadow-thumb` | Sombra só em itens flutuantes |
| Movimento | `--dur-fast` .15s, `--dur` .3s, `--ease-out`, `--ease-spring` | |

## Componentes (`css/style.css`)
- **Botão:** `.btn` (tonal), `.btn.primary` (preenchido), `.btn.ghost` (simples), `.btn.danger`, `.btn.sm`.
- **Segmented / abas internas:** `.seg`, `.subtabs`.
- **Lista agrupada:** `.rows > .row` com `.check`, `.row-title`, `.row-meta`, `.chip`, `.time`.
- **Card:** `.card`; meta: `.goal`; hábito: `.habit`; rotina: `.routine`; área: `.area-card`.
- **Formulário em sheet:** `openForm()` em `js/ui.js` → `.sheet`, `.form`, `.field`, `.lbl`, `.err`.
- **Switch iOS:** `label.switch > input[type=checkbox]`.
- **Barra de abas:** `.tabbar > .tab`; botão flutuante `.fab`.
- **Mandala e canvas:** usam apenas tokens (`--mood-*`, `--moon-*`, `--tint`).

## Como evoluir
- Novo valor visual → adicione um token em `tokens.css` e mostre em `design-system.html`.
- Novo componente → só com tokens; documente aqui e na página de referência.
- Cores de dados (área, humor) são guardadas como `var(--sys-*)`, então acompanham o tema.

## Ícones e tamanho de texto
- Barra de abas usa ícones de traço (SVG, grade 24, `stroke: currentColor`) no estilo SF Symbols; defina novos em `ICONS` (`js/main.js`).
- **Dynamic Type:** os tokens `--type-*` usam `rem × --dt`. Acompanham a preferência de fonte do navegador e o ajuste manual em ⚙️ → Tamanho do texto (Pequeno .9 · Padrão 1 · Grande 1.15 · Maior 1.3). Não use `px` para texto.

## Pendências sugeridas
- Cores de área já salvas em hexadecimal continuam funcionando, mas não mudam com o tema.
