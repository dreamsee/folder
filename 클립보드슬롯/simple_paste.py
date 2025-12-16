import keyboard
import pyperclip
import json
import os
import sys
import tkinter as tk
import time
import ctypes

# 관리자 권한 확인
def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

# 설정
SLOT_KEYS = ['a', 's', 'd', 'f', 'g', 'q', 'w', 'e', 'r', 't']

# exe 파일 위치 또는 스크립트 위치
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SAVE_FILE = os.path.join(BASE_DIR, 'slots_data.json')

class SimplePaste:
    def __init__(self):
        self.slots = {key: '' for key in SLOT_KEYS}
        self.mode = None
        self.current_clipboard = ''
        self.overlay = None
        self.running = True
        self.slot_selected = False  # 슬롯이 선택되었는지 여부
        self.load_slots()

    def load_slots(self):
        if os.path.exists(SAVE_FILE):
            try:
                with open(SAVE_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for key in SLOT_KEYS:
                        if key in data:
                            self.slots[key] = data[key]
            except:
                pass

    def save_slots(self):
        try:
            with open(SAVE_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.slots, f, ensure_ascii=False, indent=2)
        except:
            pass

    def create_overlay(self):
        self.overlay = tk.Tk()
        self.overlay.withdraw()
        self.overlay.overrideredirect(True)
        self.overlay.attributes('-topmost', True)
        self.overlay.attributes('-alpha', 0.95)
        self.overlay.configure(bg='#1e1e1e')

        screen_width = self.overlay.winfo_screenwidth()
        screen_height = self.overlay.winfo_screenheight()

        main_frame = tk.Frame(self.overlay, bg='#1e1e1e', padx=15, pady=15)
        main_frame.pack()

        self.mode_label = tk.Label(main_frame, text="", fg='#4CAF50', bg='#1e1e1e',
                                   font=('Segoe UI', 14, 'bold'))
        self.mode_label.pack(pady=(0, 15))

        slot_frame = tk.Frame(main_frame, bg='#1e1e1e')
        slot_frame.pack()

        self.slot_labels = {}
        self.content_labels = {}

        row1_keys = ['q', 'w', 'e', 'r', 't']
        for i, key in enumerate(row1_keys):
            frame, key_lbl, content_lbl = self.create_slot_widget(slot_frame, key)
            frame.grid(row=0, column=i, padx=4, pady=4)
            self.slot_labels[key] = key_lbl
            self.content_labels[key] = content_lbl

        row2_keys = ['a', 's', 'd', 'f', 'g']
        for i, key in enumerate(row2_keys):
            frame, key_lbl, content_lbl = self.create_slot_widget(slot_frame, key)
            frame.grid(row=1, column=i, padx=4, pady=4)
            self.slot_labels[key] = key_lbl
            self.content_labels[key] = content_lbl

        self.overlay.update_idletasks()
        width = self.overlay.winfo_reqwidth()
        height = self.overlay.winfo_reqheight()
        x = (screen_width - width) // 2
        y = (screen_height - height) // 2
        self.overlay.geometry(f'{width}x{height}+{x}+{y}')

    def create_slot_widget(self, parent, key):
        frame = tk.Frame(parent, bg='#2d2d2d', padx=8, pady=8)

        key_label = tk.Label(frame, text=key.upper(), fg='#FFD700', bg='#2d2d2d',
                            font=('Consolas', 16, 'bold'), width=2)
        key_label.pack()

        content = self.slots[key]
        preview = content[:12] + '..' if len(content) > 12 else content
        preview = preview.replace('\n', ' ') if preview else '(empty)'

        content_label = tk.Label(frame, text=preview, fg='#aaaaaa', bg='#2d2d2d',
                                font=('Consolas', 9), width=10)
        content_label.pack()

        # 마우스 호버 시 툴팁 표시
        frame.bind('<Enter>', lambda e, k=key: self.show_tooltip(e, k))
        frame.bind('<Leave>', lambda e: self.hide_tooltip())
        key_label.bind('<Enter>', lambda e, k=key: self.show_tooltip(e, k))
        key_label.bind('<Leave>', lambda e: self.hide_tooltip())
        content_label.bind('<Enter>', lambda e, k=key: self.show_tooltip(e, k))
        content_label.bind('<Leave>', lambda e: self.hide_tooltip())

        return frame, key_label, content_label

    def show_tooltip(self, event, key):
        content = self.slots[key]
        if not content:
            return

        # 툴팁 창 생성
        if hasattr(self, 'tooltip') and self.tooltip:
            self.tooltip.destroy()

        self.tooltip = tk.Toplevel(self.overlay)
        self.tooltip.overrideredirect(True)
        self.tooltip.attributes('-topmost', True)

        # 툴팁 내용 (최대 200자, 줄바꿈 유지)
        display_text = content[:200] + '...' if len(content) > 200 else content

        label = tk.Label(self.tooltip, text=display_text, fg='#ffffff', bg='#333333',
                        font=('Consolas', 10), padx=10, pady=8, justify='left',
                        wraplength=300)
        label.pack()

        # 마우스 위치 근처에 표시
        x = event.x_root + 10
        y = event.y_root + 10
        self.tooltip.geometry(f'+{x}+{y}')

    def hide_tooltip(self):
        if hasattr(self, 'tooltip') and self.tooltip:
            self.tooltip.destroy()
            self.tooltip = None

    def update_slot_display(self, key):
        if key in self.content_labels:
            content = self.slots[key]
            preview = content[:12] + '..' if len(content) > 12 else content
            preview = preview.replace('\n', ' ') if preview else '(empty)'
            self.content_labels[key].config(text=preview)

    def show_overlay(self, mode):
        self.mode = mode
        self.slot_selected = False
        if mode == 'copy':
            self.mode_label.config(text="COPY MODE - Select slot (Shift+key to delete)", fg='#4CAF50')
        else:
            self.mode_label.config(text="PASTE MODE - Select slot (or release Ctrl)", fg='#2196F3')

        for key in SLOT_KEYS:
            self.update_slot_display(key)

        self.overlay.deiconify()
        self.overlay.lift()
        self.overlay.update()

    def hide_overlay(self):
        self.mode = None
        if self.overlay:
            self.overlay.withdraw()

    def on_copy_hotkey(self):
        # 시스템 복사 실행
        keyboard.send('ctrl+c')
        time.sleep(0.1)

        try:
            self.current_clipboard = pyperclip.paste()
        except:
            self.current_clipboard = ''

        # 텍스트가 있을 때만 오버레이 표시 (파일/이미지는 시스템 기본 동작)
        if self.current_clipboard and self.current_clipboard.strip():
            self.overlay.after(0, lambda: self.show_overlay('copy'))

    def on_paste_hotkey(self):
        # 현재 클립보드 내용 저장
        try:
            self.current_clipboard = pyperclip.paste()
        except:
            self.current_clipboard = ''

        # 슬롯에 저장된 텍스트가 있으면 오버레이 표시
        has_saved_slots = any(self.slots[key] for key in SLOT_KEYS)

        if has_saved_slots:
            self.overlay.after(0, lambda: self.show_overlay('paste'))
        else:
            # 슬롯도 비어있으면 시스템 붙여넣기
            keyboard.send('ctrl+v')

    def on_slot_key(self, key, shift_pressed=False):
        if shift_pressed and self.mode:
            # Shift+슬롯키: 삭제
            self.slots[key] = ''
            self.save_slots()
            self.slot_selected = True
            self.overlay.after(0, self.hide_overlay)

        elif self.mode == 'copy' and self.current_clipboard:
            self.slots[key] = self.current_clipboard
            self.save_slots()
            self.slot_selected = True
            self.overlay.after(0, self.hide_overlay)

        elif self.mode == 'paste':
            if self.slots[key]:
                # 저장된 내용이 있으면 붙여넣기
                content = self.slots[key]
                self.slot_selected = True
                self.overlay.after(0, self.hide_overlay)
                time.sleep(0.05)
                pyperclip.copy(content)
                time.sleep(0.05)
                keyboard.send('ctrl+v')
            else:
                # 빈 슬롯이면 취소 (붙여넣기 없이 종료)
                self.slot_selected = True
                self.overlay.after(0, self.hide_overlay)

    def on_ctrl_release(self):
        if self.mode == 'paste' and not self.slot_selected:
            # 슬롯 선택 안하고 Ctrl 뗐으면 시스템 클립보드 그대로 붙여넣기 (파일/이미지 포함)
            self.overlay.after(0, self.hide_overlay)
            time.sleep(0.05)
            keyboard.send('ctrl+v')
        elif self.mode:
            self.overlay.after(0, self.hide_overlay)

    def on_escape(self):
        if self.mode:
            self.slot_selected = True  # ESC로 취소하면 붙여넣기 안함
            self.overlay.after(0, self.hide_overlay)

    def key_handler(self, event):
        # 모드가 활성화된 상태에서만 슬롯 키 처리
        if self.mode and event.event_type == 'down':
            key = event.name.lower()
            if key in SLOT_KEYS:
                shift_pressed = keyboard.is_pressed('shift')
                self.on_slot_key(key, shift_pressed)
                return False  # 이벤트 suppress (시스템에 전달 안함)
            elif key == 'escape':
                self.on_escape()
                return False
        return True  # 이벤트 통과

    def setup_hotkeys(self):
        # Ctrl+C: 시스템 복사 허용, 우리 기능 추가
        keyboard.add_hotkey('ctrl+c', self.on_copy_hotkey, suppress=True)

        # Ctrl+V: 가로채기 (suppress=True)
        keyboard.add_hotkey('ctrl+v', self.on_paste_hotkey, suppress=True)

        # 모든 키 이벤트 후킹 (슬롯 키 suppress 위해)
        keyboard.hook(self.key_handler, suppress=True)

        keyboard.on_release_key('ctrl', lambda e: self.on_ctrl_release())

    def run(self):

        self.create_overlay()
        self.setup_hotkeys()

        self.overlay.mainloop()

if __name__ == '__main__':
    if not is_admin():
        print("Note: Run as Administrator for best results")

    app = SimplePaste()
    app.run()
