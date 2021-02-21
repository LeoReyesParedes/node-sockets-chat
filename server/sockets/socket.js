const { io } = require('../server');

const {Usuario} = require('../classes/usuario')

const {crearMensaje} = require('../sockets/utils/utils')

const usuario = new Usuario()

io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {
        console.log(data);

        if(!data.nombre || !data.sala){
            return callback({
                ok: false,
                mensaje: 'El nombre/sala es necesario'
            })
        }

        client.join(data.sala)

        usuario.agregarUsuario(client.id, data.nombre, data.sala)

        client.broadcast.to(data.sala).emit('listaUsuarios', usuario.getUsuariosPorSala(data.sala))

        callback(usuario.getUsuariosPorSala(data.sala))
    })

    client.on('crearMensaje', (data) => {
        let user = usuario.getUsuario(client.id)

        let mensaje = crearMensaje(user.nombre, data.mensaje)
        
        client.broadcast.to(user.sala).emit('crearMensaje', mensaje)
    })

    client.on('disconnect', () => {
        let usuarioBorrado = usuario.borrarUsuario(client.id)

        client.broadcast.to(usuarioBorrado.sala).emit('crearMensaje', crearMensaje('Administrador', `${usuarioBorrado.nombre} abandonó el chat.`))

        client.broadcast.to(usuarioBorrado.sala).emit('listaUsuarios', usuario.getUsuariosPorSala(usuarioBorrado.sala))
    })

    client.on('mensajePrivado', data => {
        let user = usuario.getUsuario(client.id)

        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(user.nombre, data.mensaje))
    })

});