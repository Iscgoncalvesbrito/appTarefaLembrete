import React,{useState, useEffect, useRef} from 'react'
import { StyleSheet, Text, View, SafeAreaView, FlatList, Modal, TextInput, Animated, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notificarions from "expo-notifications";
import {Ionicons} from '@expo/vector-icons';

// Configuração das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
const [tasks, setTasks] = useState([]);
const [modal, setModal] = useState(false);

const [title, setTitle] = useState("");
const {time, setTime} = useState("");

const [toast, setToast] = useState("");
const top = useRef(new Animated.Value(-50)).current;


  // Carregar tarefa
  useEffect(() => {
    async function load() {
      const data = await AsyncStorage.getItem("@tasks");

      if (data) {
        setTasks(JSON.parse(data));
      }

      if (Platform.OS !== "web") {
        await Notifications.requestPermissionsAsync();
      }
    }

    load();
  }, []);

  // Salvar tarefa
  useEffect(() => {
    AsyncStorage.setItem("@tasks", JSON.stringify(tasks));
  }, [tasks]);

   useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      const current =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0");

      tasks.forEach((item) => {
        if (
          item.time === current &&
          !item.done &&
          !item.notified &&
          Platform.OS === "web"
        ) {
          showToast(item.title);

          const list = tasks.map((t) =>
            t.id === item.id ? { ...t, notified: true } : t
          );

          setTasks(list);
        }
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [tasks]);

  function showToast(message) {
    setToast("⏰ Lembrete: " + message);

    Animated.sequence([
      Animated.timing(top, {
        toValue: 50,
        duration: 400,
        useNativeDriver: false,
      }),
      Animated.delay(3000),
      Animated.timing(top, {
        toValue: -80,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }

async function scheduleNotification(taskTitle, hour) {
    if (Platform.OS === "web") return;

    const [h, m] = hour.split(":");

    const date = new Date();
    date.setHours(Number(h));
    date.setMinutes(Number(m));
    date.setSeconds(0);

    if (date <= new Date()) {
      date.setDate(date.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📌 Lembrete de tarefa",
        body: taskTitle,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  }


//função adiciona a tarefa
async function addTask() {
    if (title === "" || time === "") return;

    const task = {
      id: Date.now().toString(),
      title,
      time,
      done: false,
      notified: false,
    };

    await scheduleNotification(title, time);

    setTasks([...tasks, task]);

    setTitle("");
    setTime("");
    setModal(false);
  }

  // muda a função para pendente ou concluida
  function toggle(id) {
    const list = tasks.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          done: !item.done,
          notified: false,
        };
      }

      return item;
    });

    setTasks(list);
  }

  // Excluir a tarefa
  function remove(id) {
    setTasks(tasks.filter((item) => item.id !== id));
  }

    return (
    <SafeAreaView style={styles.container}>
      {/* TOAST WEB */}
      <Animated.View style={[styles.toast, { top }]}>
        <Text style={styles.toastText}>{toast}</Text>
      </Animated.View>

      <Text style={styles.title}>🧾✅Minhas Tarefas</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => toggle(item.id)}>
              <Ionicons
                name={
                  item.done ? "checkmark-circle" : "ellipse-outline"
                }
                size={28}
                color={item.done ? "#16A34A" : "#888"}
              />
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={[
                  styles.task,
                  item.done && styles.done,
                ]}
              >
                {item.title}
              </Text>

              <Text style={styles.time}>
                🕒 {item.time}
              </Text>
            </View>

            <TouchableOpacity onPress={() => remove(item.id)}>
              <Ionicons
                name="trash-outline"
                size={24}
                color="#d62828"
              />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* BOTÃO + */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModal(true)}
      >
        <Ionicons name="add" size={34} color="#FFF" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modal} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <Text style={styles.modalTitle}>📓Nova tarefa</Text>

          <TextInput
            placeholder="Título da tarefa"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            placeholder="Horário (20:30)"
            style={styles.input}
            value={time}
            onChangeText={setTime}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />

          <TouchableOpacity
            style={styles.save}
            onPress={addTask}
          >
            <Text style={styles.saveText}>Salvar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModal(false)}
              style={styles.save}
          >
            <Text style={styles.saveText}>Cancelar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
