/* -------not use*/

import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const AttendanceTable = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const response = await axios.get("/api/attendance");
            setAttendanceData(response.data);
        } catch (error) {
            console.error("Error fetching attendance data:", error);
        }
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredData = attendanceData.filter((record) =>
        record.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Attendance Records", 20, 10);
        doc.autoTable({
            head: [["ID", "Name", "Job Role", "Date", "In-Time", "Out-Time"]],
            body: filteredData.map(({ id, name, jobRole, date, inTime, outTime }) => [
                id, name, jobRole, date, inTime, outTime
            ]),
        });
        doc.save("attendance_records.pdf");
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        XLSX.writeFile(workbook, "attendance_records.xlsx");
    };

    return (
        <div>
            <h2>Attendance Records</h2>
            <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={handleSearch}
            />
            <button onClick={exportToPDF}>Export to PDF</button>
            <button onClick={exportToExcel}>Export to Excel</button>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Job Role</th>
                        <th>Date</th>
                        <th>In-Time</th>
                        <th>Out-Time</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((record) => (
                        <tr key={record.id}>
                            <td>{record.id}</td>
                            <td>{record.name}</td>
                            <td>{record.jobRole}</td>
                            <td>{record.date}</td>
                            <td>{record.inTime}</td>
                            <td>{record.outTime}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AttendanceTable;
