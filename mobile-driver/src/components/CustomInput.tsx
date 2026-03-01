import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface CustomInputProps extends TextInputProps {
    label?: string;
}

export default function CustomInput(props: CustomInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            <TextInput
                {...props}
                style={[
                    styles.input,
                    props.style,
                    isFocused && styles.inputFocused
                ]}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                placeholderTextColor="#9ca3af"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    input: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 16,
        color: '#111827',
    },
    inputFocused: {
        borderColor: '#8b5cf6',
        borderWidth: 2,
        // Add a slight shadow or elevation for a more premium feel if desired
        elevation: 2,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
});
