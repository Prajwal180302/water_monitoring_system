from app import create_app
from app.services.user_service import assign_names_to_existing_users, ensure_application_columns, get_all_users_display


def main():
    app = create_app()
    with app.app_context():
        ensure_application_columns()
        updated = assign_names_to_existing_users()

        if updated:
            print("Updated users with generated names:")
            for item in updated:
                print(f"{item['name']} - {item['email']}")
        else:
            print("No users required name backfill.")

        print("\nCurrent user list:")
        for entry in get_all_users_display():
            print(entry)


if __name__ == "__main__":
    main()
