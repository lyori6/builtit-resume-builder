export async function downloadResumePDF(elementId: string, filename: string = 'resume.pdf') {
  const element = document.getElementById(elementId)

  if (!element) {
    console.error(`Element with id "${elementId}" not found`)
    return
  }

  // Create a hidden iframe
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  // Get the iframe's document
  const iframeDoc = iframe.contentWindow?.document
  if (!iframeDoc) {
    console.error('Could not get iframe document')
    document.body.removeChild(iframe)
    return
  }

  // Gather all style sheets
  const styleSheets = Array.from(document.styleSheets)
  let styles = ''

  try {
    // Try to copy styles from style sheets
    for (const sheet of styleSheets) {
      try {
        if (sheet.href) {
          styles += `<link rel="stylesheet" href="${sheet.href}" />`
        } else if (sheet.cssRules) {
          const rules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n')
          styles += `<style>${rules}</style>`
        }
      } catch (e) {
        console.warn('Could not access style sheet rules', e)
      }
    }
  } catch (e) {
    console.warn('Error gathering styles', e)
  }

  // Also copy any style tags in head
  const styleTags = document.head.querySelectorAll('style')
  styleTags.forEach(tag => {
    styles += tag.outerHTML
  })

  // Construct the iframe content
  iframeDoc.open()
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${styles}
        <style>
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          @media print {
            @page {
              margin: 0.5in !important;
              size: letter !important;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Prevent awkward breaks */
            h1, h2, h3, h4, h5, h6 { 
              page-break-after: avoid !important; 
              break-after: avoid !important;
            }
            p { 
              orphans: 2 !important; 
              widows: 2 !important; 
            }
            /* Allow items to break if needed (less strict) */
            .break-inside-avoid { 
              page-break-inside: auto !important; 
              break-inside: auto !important;
            }
            /* Allow breaks between items */
            .mb-3, .mb-4 {
              break-before: auto !important;
              break-after: auto !important;
            }
            
            /* Ensure main container allows breaking */
            .resume-content {
               display: block !important;
               height: auto !important;
               overflow: visible !important;
            }
            
            /* Force block layout for sections to avoid flexbox pagination issues */
            .resume-section-content {
               display: block !important;
            }
          }
          /* Ensure the resume container takes full width/height if needed */
          #${elementId} {
             width: 100%;
             max-width: none !important;
             margin: 0 !important;
             box-shadow: none !important;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
           // Wait for images/fonts to load then print
           window.onload = () => {
             setTimeout(() => {
               window.print();
               // We can't automatically close/remove in all browsers after print, 
               // but the parent script handles removal after a delay.
             }, 500);
           }
        </script>
      </body>
    </html>
  `)
  iframeDoc.close()

  // Clean up after a delay to allow print dialog to open
  // Note: There's no reliable cross-browser way to know when print is done.
  // We leave it for a bit.
  setTimeout(() => {
    document.body.removeChild(iframe)
  }, 2000) // 2 seconds should be enough to trigger the dialog
}
