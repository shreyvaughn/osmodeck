#[tokio::main(worker_threads = 2)]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // `std::env::args()` panics on an argument that isn't UTF-8 (#705).
    let mut args = Vec::new();
    for (index, arg) in std::env::args_os().enumerate().skip(1) {
        match arg.into_string() {
            Ok(arg) => args.push(arg),
            Err(arg) => {
                eprintln!(
                    "Argument {index} isn't valid UTF-8: {}. Pass text; send bytes on stdin instead (room-cli mac run --stdin).",
                    arg.to_string_lossy()
                );
                std::process::exit(2);
            }
        }
    }
    if args.first().map(String::as_str) == Some("--version") {
        println!("osmodeck {} ({})", osmodeck::VERSION, osmodeck::COMMIT);
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("--features") {
        println!("{}", osmodeck::FEATURES.join("\n"));
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("preview") {
        osmodeck::preview::cli(&args[1..]).await?;
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("mac") {
        match osmodeck::mac::cli(&args[1..]).await {
            Ok(code) => std::process::exit(code),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
    }
    if args.first().map(String::as_str) == Some("secret") {
        match osmodeck::secrets::cli(&args[1..]).await {
            Ok(code) => std::process::exit(code),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
    }
    if args.first().map(String::as_str) == Some("thread") {
        match osmodeck::session::thread::cli(&args[1..]).await {
            Ok(code) => std::process::exit(code),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
    }
    if matches!(
        args.first().map(String::as_str),
        Some("feedback" | "report")
    ) {
        match osmodeck::session::report::cli(&args[1..]).await {
            Ok(code) => std::process::exit(code),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
    }
    if args.first().map(String::as_str) == Some("usage") {
        match osmodeck::session::report::usage_cli(&args[1..]).await {
            Ok(code) => std::process::exit(code),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
    }
    if matches!(
        args.first().map(String::as_str),
        Some("automation" | "loop")
    ) {
        match osmodeck::session::automation::cli(&args[1..]).await {
            Ok(code) => std::process::exit(code),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
    }
    if args.first().map(String::as_str) == Some("files") {
        match osmodeck::workspace::files::cli(&args[1..]).await {
            Ok(code) => std::process::exit(code),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
    }
    if args.first().map(String::as_str) == Some("computer-use") {
        match osmodeck::computer_use::cli(&args[1..]).await {
            Ok(code) => std::process::exit(code),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
    }
    if args.first().map(String::as_str) == Some("gpu") {
        match osmodeck::gpu::cli(&args[1..]).await {
            Ok(code) => std::process::exit(code),
            Err(error) => {
                eprintln!("{error}");
                std::process::exit(1);
            }
        }
    }
    if args.first().map(String::as_str) == Some("--gpu-skill") {
        print!("{}", osmodeck::gpu::SKILL);
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("--computer-use-skill") {
        print!("{}", osmodeck::computer_use::SKILL);
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("--secrets-skill") {
        print!("{}", osmodeck::secrets::SKILL);
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("--mac-skill") {
        print!("{}", osmodeck::mac::SKILL);
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("--room-cli-skill") {
        print!("{}", osmodeck::mac::ROOM_CLI_SKILL);
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("--preview-skill") {
        print!("{}", osmodeck::preview::SKILL);
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("--preview-authorized-keys") {
        if args.len() != 4 || args[3] != "osmodeck-preview" {
            return Err("invalid preview key lookup".into());
        }
        osmodeck::preview::authorized_keys(std::path::Path::new(&args[1]), args[2].parse()?)?;
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("--cursor-driver") {
        let binary = args.get(1).ok_or("missing Cursor binary")?;
        osmodeck::runtime::cursor_print::run(binary)?;
        return Ok(());
    }
    if args.first().map(String::as_str) == Some("--clean-npm-cache") {
        let root = std::env::args_os().nth(2).ok_or("missing cache root")?;
        let groups = std::env::args_os()
            .nth(3)
            .ok_or("missing workload groups")?;
        osmodeck::workspace::storage::clean_npm_cache(
            std::path::Path::new(&root),
            std::path::Path::new(&groups),
        )?;
        return Ok(());
    }
    // The service starts without arguments; anything else is a mistyped agent command.
    if let Some(command) = args.first() {
        let commands = "Commands: room-cli thread, automation (loop), mac, secret, files, preview, computer-use, gpu, usage, feedback. Add --help to any of them. Other threads, projects, and settings live on the user's Mac: see the room-cli skill.";
        if matches!(command.as_str(), "--help" | "-h" | "help") {
            println!("{commands}");
            return Ok(());
        }
        eprintln!("Unknown command {command}. {commands}");
        std::process::exit(2);
    }
    osmodeck::serve(osmodeck::config::Config::from_env()?).await
}
