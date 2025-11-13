import { JoyBoy } from "@joyboy-parser/core";




async function main(){
    try {
            console.log("load manhuafast source")
            await JoyBoy.loadSource('@joyboy-parser/source-manhuafast')
            
            console.log("get source")

            const manhuafast =  JoyBoy.getSource('manhuafast')

            console.log("Search solo leveling")
            const sololeveling = await manhuafast.search("solo leveling")
            console.log(sololeveling)

            const first = sololeveling[0]
            
            console.log("get trending")


            if(manhuafast.getTrending){
                const trending = await manhuafast.getTrending()
                console.log(trending)
            }





    } catch (error) {
        console.dir(error)
    }
}


main()