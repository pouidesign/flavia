# Minha Vida

App pessoal para organizar a vida: agenda (dia/semana/mês), metas mensuráveis, tarefas, hábitos, rotinas, áreas da vida, notas, journal, canvas e humor com mandala lunar.
Os dados ficam só no aparelho (localStorage). Não precisa de servidor nem de instalação de dependências.

## Rodar localmente
```
python3 -m http.server 8000
```
Abra http://localhost:8000

## Instalar no iPhone (depois de publicar em um endereço https)
1. Abra o endereço no **Safari**.
2. Toque em **Compartilhar** → **Adicionar à Tela de Início**.
3. Abra pelo ícone: o app roda em tela cheia e funciona sem internet.

> Os dados do app instalado ficam separados dos do Safari. Use Configurações → Exportar backup para guardar uma cópia.

## Design system
Veja `DESIGN.md` e abra `design-system.html`. Tokens em `css/tokens.css`.

## Salvar na nuvem (Supabase)
- Login por e-mail e senha pelo ícone de nuvem no topo do app. Cada mudança é salva no aparelho na hora e enviada em segundo plano.
- Ao entrar em outro aparelho, o progresso é baixado. Se os dois lados mudaram, o app pergunta qual manter.
- Banco: rode `supabase/schema.sql` no SQL Editor do projeto. Chaves públicas em `js/config.js`.
- No Supabase, em Authentication → Sign In / Providers → Email, desligue **Confirm email**.
- Só funciona a partir de um endereço https próprio (não funciona dentro do artefato do Claude).
