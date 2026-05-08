import os

def sub(file, oldP, newP):
    p = 'src/' + file
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace(oldP, newP)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)

sub('Components/AnimalRequestModal.jsx', 'const [step, setStep] = useState(1)', 'const [step] = useState(1)')
sub('Components/ListingsMap.jsx', 'import { useNavigate } from \'react-router-dom\'\n', '')
sub('Components/NotificationBell.jsx', 'import { useAuth } from \'../context/AuthContext\'\n', '')
sub('Components/NotificationBell.jsx', '  const { user } = useAuth()\n', '')
sub('__tests__/PostListing.test.jsx', 'import { render, screen }', 'import { render }')
sub('pages/Login.jsx', 'const [verified, setVerified] = useState(false)\n', '')
sub('pages/Messages.jsx', '  const navigate = useNavigate()\n', '')
sub('pages/Messages.jsx', '  }, [chatId, user])', '  }, [chatId, user, withName])')
sub('pages/OrderReceipt.jsx', '  const navigate = useNavigate()\n', '')
sub('pages/OrderReceipt.jsx', '  }, [id, searchParams])', '  }, [id, searchParams, order])')
sub('pages/PostListing.jsx', '  const navigate = useNavigate()\n', '')
sub('pages/PostListing.jsx', '} catch (_) {}', '} catch { /* ignore */ }')
sub('pages/Profile.jsx', 'const { isFav, toggle: toggleFav } = useFavorites()', 'const { isFav } = useFavorites()')
sub('pages/Profile.jsx', '  }, [activeTab])', '  }, [activeTab, toast])')
