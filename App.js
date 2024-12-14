import React, { useState } from 'react';
import {
	SafeAreaView,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Switch,
	Dimensions,
	Keyboard,
	TouchableWithoutFeedback,
	Platform,
	Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DropDownPicker from 'react-native-dropdown-picker';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

export default function App() {
	const [inputText, setInputText] = useState('');
	const [resultText, setResultText] = useState('');
	const [isEnabled, setIsEnabled] = useState(false);
	const [transformMode, setTransformMode] = useState('alphabetToHangul');
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState([
		{ label: '알파벳 → 한글', value: 'alphabetToHangul' },
		{ label: '한글 → 알파벳', value: 'hangulToAlphabet' },
	]);
	const [modalVisible, setModalVisible] = useState(false);

	const handlePaste = async () => {
		const clipboardText = await Clipboard.getStringAsync();
		setInputText(clipboardText);
	};

	const handleTransform = async () => {
		if (!inputText.trim()) {
			Toast.show({
				type: 'info',
				text1: '알림',
				text2: '텍스트를 입력해주세요.',
			});
			return;
		}

		const svctype = transformMode === 'alphabetToHangul' ? 'enko' : 'koen';

		try {
			const response = await axios.get(
				`https://apis.uiharu.dev/chenko/chenko.php`,
				{
					params: {
						svctype,
						value: inputText,
					},
				}
			);

			if (response.data && response.data.modified_value) {
				setResultText(response.data.modified_value);
			} else {
				Toast.show({
					type: 'error',
					text1: '오류',
					text2: '변환 결과를 가져올 수 없습니다.',
				});
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: '오류',
				text2: 'API 요청 실패 또는 인터넷 연결을 확인하세요.',
			});
		}
	};

	const handleCopy = async () => {
		if (!resultText.trim()) {
			Toast.show({
				type: 'info',
				text1: '알림',
				text2: '결과 텍스트가 없습니다.',
			});
			return;
		}
		await Clipboard.setStringAsync(resultText);
		Toast.show({
			type: 'success',
			text1: '알림',
			text2: '결과 텍스트가 복사되었습니다.',
		});
	};

	const handleShare = async () => {
		if (!(await Sharing.isAvailableAsync())) {
			Toast.show({
				type: 'error',
				text1: '공유 불가',
				text2: '이 장치에서는 공유 기능을 사용할 수 없습니다.',
			});
			return;
		}
		try {
			const tempFilePath = FileSystem.cacheDirectory + 'result.txt';
			await FileSystem.writeAsStringAsync(tempFilePath, resultText, {
				encoding: FileSystem.EncodingType.UTF8,
			});
			await Sharing.shareAsync(tempFilePath);
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: '오류',
				text2: error.message,
			});
		}
	};

	return (
		<>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<SafeAreaView style={styles.safeContainer}>
					<View style={styles.container}>
						{Platform.OS === 'ios' ? (
							<View style={styles.dropdownWrapper}>
								<DropDownPicker
									open={open}
									value={transformMode}
									items={items}
									setOpen={setOpen}
									setValue={setTransformMode}
									setItems={setItems}
									style={styles.dropdown}
									textStyle={{ textAlign: 'center', fontSize: 16 }}
									zIndex={1000}
									zIndexInverse={3000}
									modalTitle="변환 모드 선택"
									modalAnimationType="slide"
								/>
							</View>
						) : (
							<View style={styles.dropdownContainer}>
								<DropDownPicker
									open={open}
									value={transformMode}
									items={items}
									setOpen={setOpen}
									setValue={setTransformMode}
									setItems={setItems}
									style={styles.dropdown}
									textStyle={{ textAlign: 'center', fontSize: 16 }}
								/>
							</View>
						)}

						<View style={styles.inputSection}>
							<TextInput
								style={styles.textInput}
								placeholder="텍스트를 입력하세요"
								placeholderTextColor="#999"
								value={inputText}
								onChangeText={setInputText}
								multiline={true}
								textAlignVertical="top"
							/>
							<View style={styles.buttonRow}>
								<TouchableOpacity
									style={styles.smallButton}
									onPress={handlePaste}>
									<Text style={styles.buttonText}>붙여넣기</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.transformButton}
									onPress={handleTransform}>
									<Text style={styles.buttonText}>변환하기</Text>
								</TouchableOpacity>
							</View>
						</View>

						<View style={styles.resultSection}>
							<Text style={styles.resultText}>{resultText}</Text>
							<View style={styles.resultFooterRow}>
								<TouchableOpacity
									style={styles.iconButton}
									onPress={handleCopy}>
									<MaterialIcons name="content-copy" size={24} color="#333" />
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.iconButton}
									onPress={handleShare}>
									<MaterialIcons name="share" size={24} color="#333" />
								</TouchableOpacity>
							</View>
						</View>

						<View style={styles.bottomRow}>
							<View style={styles.infoSection}>
								<TouchableOpacity
									onPress={() => setModalVisible(true)}
									style={styles.infoButton}>
									<MaterialIcons name="info-outline" size={24} color="#333" />
								</TouchableOpacity>
								<Text style={styles.infoText}>정보</Text>
							</View>
							<View style={styles.switchSection}>
								<Text style={styles.toggleLabel}>복자음 가능</Text>
								<Switch
									trackColor={{ false: '#ccc', true: '#81b0ff' }}
									thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
									onValueChange={() => setIsEnabled(!isEnabled)}
									value={isEnabled}
								/>
							</View>
						</View>
					</View>

					<Modal
						transparent={true}
						visible={modalVisible}
						animationType="slide">
						<View style={styles.modalBackground}>
							<View style={styles.modalContainer}>
								<Text style={styles.modalTitle}>정보</Text>
								<View style={styles.modalContent}>
									<Text style={styles.modalText}>본 앱은 다음을 활용합니다:</Text>
									<Text style={styles.modalText}>- https://github.com/738/inko inko 라이브러리</Text>
									<Text style={styles.modalText}>- 인터넷 연결 필요</Text>
									<Text style={styles.modalText}>- API를 통해 값을 주고받습니다.</Text>
									<Text style={styles.modalText}>
										- 한글 → 알파벳 변환 시, 대소문자 구분이 완벽하지 않습니다 (예: 'G'는 대/소문자 구분 없이 'ㅎ'로 변환됨).
									</Text>
								</View>
								<TouchableOpacity
									style={styles.closeButton}
									onPress={() => setModalVisible(false)}>
									<Text style={styles.closeButtonText}>닫기</Text>
								</TouchableOpacity>
							</View>
						</View>
					</Modal>

					<Toast topOffset={Platform.OS === 'ios' ? 50 : 0} position="top" />
				</SafeAreaView>
			</TouchableWithoutFeedback>
		</>
	);
}

const styles = StyleSheet.create({
	safeContainer: {
		flex: 1,
		backgroundColor: '#f2f2f2',
	},
	container: {
		flex: 1,
		padding: 20,
	},
	dropdownContainer: {
		marginBottom: 20,
	},
	dropdown: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 4,
	},
	inputSection: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 4,
		backgroundColor: '#fff',
		padding: 15,
		marginBottom: 20,
	},
	textInput: {
		flex: 1,
		fontSize: 16,
		color: '#333',
		textAlignVertical: 'top',
		textAlign: 'left',
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
	},
	smallButton: {
		flex: 1,
		backgroundColor: '#ddd',
		padding: 12,
		borderRadius: 4,
		marginRight: 5,
		alignItems: 'center',
	},
	transformButton: {
		flex: 1,
		backgroundColor: '#00c73c',
		padding: 12,
		borderRadius: 4,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	resultSection: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 4,
		backgroundColor: '#fff',
		padding: 15,
		justifyContent: 'space-between',
	},
	resultText: {
		fontSize: 16,
		color: '#333',
		textAlign: 'left',
	},
	resultFooterRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	iconButton: {
		padding: 10,
		marginHorizontal: 5,
		backgroundColor: '#eee',
		borderRadius: 4,
	},
	bottomRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 20,
	},
	infoSection: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	infoText: {
		fontSize: 16,
		marginLeft: 8,
	},
	switchSection: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	toggleLabel: {
		fontSize: 16,
		marginRight: 10,
	},
	modalBackground: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer: {
		width: '80%',
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 20,
		alignItems: 'center',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	modalContent: {
		marginBottom: 20,
	},
	modalText: {
		fontSize: 16,
		marginVertical: 5,
		textAlign: 'center',
	},
	closeButton: {
		backgroundColor: '#00c73c',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
	},
	closeButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
