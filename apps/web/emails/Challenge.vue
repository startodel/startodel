<script setup>
defineProps(["palette", "locale", "copy", "code", "link"]);
</script>
<template>
  <html :lang="locale">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{{ copy.heading }}</title>
    </head>
    <body
      :style="{
        margin: 0,
        backgroundColor: palette.bg,
        color: palette.ink,
        fontFamily: palette.ui,
      }"
    >
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tbody>
          <tr>
            <td align="center" style="padding: 24px 12px">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                :style="{
                  maxWidth: '520px',
                  backgroundColor: palette.raised,
                  border: '1px solid ' + palette.line,
                  borderTop: '4px solid ' + palette['copper-fill'],
                }"
              >
                <tbody>
                  <tr>
                    <td
                      :style="{
                        padding: '24px 28px',
                        font: 'bold 17px ' + palette.mono,
                        borderBottom: '1px solid ' + palette.line,
                      }"
                    >
                      Startodel
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 28px">
                      <h1 style="font-size: 23px; line-height: 1.3; margin: 0 0 16px">
                        {{ copy.heading }}
                      </h1>
                      <p
                        :style="{
                          font: 'bold 36px ' + palette.mono,
                          letterSpacing: '4px',
                          margin: '0 0 20px',
                        }"
                      >
                        {{ code }}
                      </p>
                      <p style="margin: 0 0 20px; line-height: 1.5">{{ copy.expires }}</p>
                      <a
                        v-if="link"
                        :href="link"
                        :style="{
                          display: 'inline-block',
                          padding: '12px 18px',
                          backgroundColor: palette['copper-fill'],
                          color: palette['on-copper'],
                          fontWeight: 'bold',
                          textDecoration: 'none',
                          borderRadius: '4px',
                        }"
                        >{{ copy.button }}</a
                      >
                    </td>
                  </tr>
                  <tr>
                    <td
                      :style="{
                        padding: '18px 28px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: palette['ink-2'],
                        borderTop: '1px solid ' + palette.line,
                      }"
                    >
                      {{ copy.ignore }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  </html>
</template>
