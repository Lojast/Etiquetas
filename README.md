# Gerador de etiquetas — LojaST

Gera a etiqueta de identificação de aparelhos (celular, notebook, tablet) e imprime em impressora térmica, papel **150 × 100 mm**. Roda 100% no navegador: sem servidor, sem build, sem dependências.

```
index.html   a página
style.css    visual (as cores e fontes da marca estão nos tokens do topo, em :root)
app.js       formulário, etiqueta, código de barras Code128, impressão e histórico
logo.png     logo da LojaST (usada no cabeçalho e, em preto e branco, na etiqueta)
```

## Publicar no GitHub Pages

1. Crie um repositório e envie os 4 arquivos acima para a raiz da branch `main`.
2. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Escolha **Branch: `main`** e **pasta: `/ (root)`** → **Save**.
4. Em cerca de 1 minuto o endereço aparece no topo da mesma tela (`https://SEU-USUARIO.github.io/NOME-DO-REPO/`).

Para atualizar, basta enviar os arquivos alterados. Também funciona abrindo o `index.html` direto do computador.

> Tudo que o app guarda (rascunho, histórico, tema, logo enviada) fica no navegador de quem usa e não é sincronizado entre computadores. A página tem `noindex` para não aparecer no Google.

## Trocar a logo

- **Para todos:** substitua o `logo.png` por outro PNG com **arte escura ou colorida** em fundo transparente ou branco (a versão toda branca some na etiqueta). Pode ter qualquer proporção; recomendo 800 px de largura ou mais.
- **Só neste navegador:** no bloco **Finalização → Logo da loja na etiqueta → Enviar logo…**. A etiqueta usa, nesta ordem: logo enviada, `logo.png`, texto “LojaST”.

A logo sai em escala de cinza com contraste forte e sem margens vazias, para a térmica. Quem usa o Pages ganha esse tratamento direto no navegador; ao abrir o arquivo do disco, o app usa um filtro de CSS equivalente.

## Configurar a impressora térmica (150 × 100 mm)

**Uma vez, no driver da impressora** (Windows: *Impressoras e scanners → sua térmica → Preferências de impressão*):

1. Crie/escolha o tamanho de papel **150 mm de largura × 100 mm de altura** e deixe como padrão.
2. Se a impressora usa etiquetas com espaço entre elas, rode a calibração do sensor (*Calibrar* / *Auto detect*) para a etiqueta sair centralizada.

**Em cada impressão** (botão **Imprimir etiqueta** ou `Ctrl+P`; o Chrome lembra os ajustes):

| Opção | Valor |
| --- | --- |
| Destino | a impressora térmica |
| Tamanho do papel | 150 × 100 mm |
| Margens | Nenhuma |
| Escala | Padrão (100%) |
| Cabeçalhos e rodapés | desmarcado |
| Gráficos de plano de fundo | tanto faz (o app já força os pretos) |

Para testar sem gastar etiqueta, escolha **Salvar como PDF** com os mesmos ajustes: deve sair **1 página** por cópia, só com a etiqueta.

**Saiu girada ou cortada?** Alguns drivers definem o papel como 100 × 150 (retrato). Gire a impressão em 90° no driver (*Orientação/Rotação*) ou ajuste o tamanho do papel para 150 × 100.

## Atalhos

- `Ctrl/Cmd + P`: imprime a etiqueta.
- `Ctrl/Cmd + N`: nova etiqueta. O Chrome reserva `Ctrl+N` em abas normais; nesse caso use `Alt + N` ou o botão **Nova etiqueta**.
- O campo **Cópias** (ao lado do botão de imprimir) manda N páginas iguais, por exemplo uma para o aparelho e outra para a caixa.
