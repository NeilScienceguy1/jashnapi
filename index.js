const { Server } = require("socket.io")
const express = require("express")
const app = express()
const { createServer } = require('node:http');
const cors = require("cors")
app.use(cors())
app.use(express.json())
const server = createServer(app)
const fs = require("fs")
const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000"
    }
  })

let locked = false;

var allClients = [];
var highlights = [];
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

io.on("connection", (socket) => {
    
    socket.emit("highlightChange", highlights)
    socket.on("clientLocationChange", (socketId, location) => {
        if (allClients.indexOf(socketId) == -1) {
            allClients.push(socket.id)
            highlights.push({columnId:location.columnId, rowId: location.rowId, borderColor: getRandomColor()})
        } else {
            let idx = allClients.indexOf(socketId)
            let color = highlights[idx].borderColor
            highlights[idx] = {columnId:location.columnId, rowId: location.rowId, borderColor:color}
            io.emit("highlightChange", highlights)
        }
    })
    socket.on("disconnect", () => {
        allClients.forEach(client => {
            if (client = socket.id) {
                allClients.splice(allClients.indexOf(socket.id), 1)
                highlights.splice(allClients.indexOf(socket.id), 1)
            }
        })
    })
    socket.on("data-change", (data1, grade) => {
        if (data1?.length > 0 && grade == "9" || grade == "10" || grade == "11" || grade == "12" ) {
            if (locked == false) {
                let filename = path.join(process.cwd(), `final${grade}.json`)
                fs.writeFileSync(filename, JSON.stringify(data1))
                socket.broadcast.emit("data-change-server", data1)
            }
        }
    })

})

app.post("/lock", (req, res) => {
    locked = !locked
    res.send("ok")
})
app.get("/lock", (req, res) => {
    res.send(locked)
})

app.get("/clientcount", (req, res) => {
    res.send({
        clients: allClients,
        highlights: highlights
    })
})

app.get("/:grade", (req, res) => {
    const grade = req.params.grade
    if (grade == "9" || grade == "10" || grade == "11" || grade == "12") {
        let file = path.join(process.cwd(), `final${grade}.json`)
        let JSONdata = fs.readFileSync(file)
        let data = JSON.parse(JSONdata)
        return res.send(data)
    } else {
        let students = []
        for (let i = 9; i <=12; i++) {
            let data = JSON.parse(fs.readFileSync(path.join(process.cwd(), `final${i}.json`)))
            data.forEach(stu => {
                if (stu["Event 1"].toLowerCase() == grade.toLowerCase() || stu["Event 2"].toLowerCase() == grade.toLowerCase() || stu["Event 3"].toLowerCase() == grade.toLowerCase() || stu["Event 4"].toLowerCase() == grade.toLowerCase()) {
                    students.push(stu)
                }
            })
        }
        return res.send(students)
    }

})

server.listen(process.env.PORT || 4000, () => {
    console.log("listening")
})
