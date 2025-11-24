import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register a standard font
Font.register({
    family: 'Times-Roman',
    src: 'https://fonts.gstatic.com/s/timesnewroman/v1/TimesNewRoman.ttf'
})

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Times-Roman',
    },
    text: {
        fontSize: 12,
        lineHeight: 1.5,
        marginBottom: 12,
        color: '#000000',
    },
})

interface CoverLetterPdfProps {
    coverLetter: string
}

const CoverLetterPdf: React.FC<CoverLetterPdfProps> = ({ coverLetter }) => {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <View>
                    {coverLetter.split('\n').map((line, index) => (
                        <Text key={index} style={styles.text}>
                            {line}
                        </Text>
                    ))}
                </View>
            </Page>
        </Document>
    )
}

export default CoverLetterPdf
