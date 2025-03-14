export type TodoEntry = {
    id: number;
    title: string;
    completed: boolean;
}

const mockData: TodoEntry[] = [
    { id: 1, title: "Buy milk", completed: false },
    { id: 2, title: "Buy eggs", completed: true },
    { id: 3, title: "Buy bread", completed: false },
]

export function getMockDataList() {
    return mockData;
}

export function getFilteredMockDataList(titlePart: string) {
    return mockData.filter((item) => item.title.includes(titlePart));
}

export function getMockDataEntryById(id: number|string) {
    return mockData.find(item => item.id === +id);
}

export function addMockDataEntry(item: Omit<TodoEntry, 'id'>) {
    const id = mockData.length + 1;
    const entry = { id, ...item };
    mockData.push(entry);
    return entry
}

export function updateMockDataEntry(id: number|string, item: Omit<TodoEntry, 'id'>) {
    const index = mockData.findIndex(item => item.id === +id);
    if (index === -1) return null;
    mockData[index] = { id: +id, ...item };
    return mockData[index];
}

export function deleteMockDataEntry(id: number|string) {
    const index = mockData.findIndex(item => item.id === +id);
    if (index === -1) return null;
    mockData.splice(index, 1);
    return true
}